'use strict';

const {EventEmitter} = require('@xmpp/events');
const xml = require('@xmpp/xml');

const SINS = 'http://jabber.org/protocol/si';
const SIPNS = 'http://jabber.org/protocol/si/profile/file-transfer';
const SIFNNS = 'http://jabber.org/protocol/feature-neg';
const DNS = 'jabber:x:data';

const IBBNS = 'http://jabber.org/protocol/ibb';

const isSIStreamInitiationRequest = ({stanza}) => {
	const child = stanza.getChild('si');
	const feature = child.getChild('feature');
	const check1 = child.attrs.profile === SIPNS && feature.attrs.xmlns === SIFNNS;

	const x = feature.getChild('x');
	if (!x) {
		return false;
	}
	const field = x.getChild('field');
	if (!field) {
		return false;
	}
	const option = field.getChild('option');
	if (!option) {
		return false;
	}

	const check2 = x.attrs.type === 'form';

	return check1 && check2;
};

const parseValues = stanza => {
	const c1 = stanza.getChild('si');
	if (c1 && c1.getChild('feature')) {
		return c1.getChild('feature').getChild('x').getChild('field').getChildren('value');
	}
	return null;
};

class SIPlugin extends EventEmitter {
	constructor(client) {
		super();
		this.client = client;
		this._supportedMethods = [];
		this.init();
	}

	init() {
		const { iqCallee } = this.client;
		iqCallee.set(SINS, 'si', ctx => {
			if (isSIStreamInitiationRequest(ctx)) {
				return this.onSIStreamInitiationRequest(ctx);
			}
			return false;
		});
	}

	addMethod(method) {
		this._supportedMethods.push(method);
	}

	send(id, sid, to, fileSize, fileName, mimeType, date, hash) {
		const { iqCaller } = this.client;

		const preferredMethod = this._supportedMethods[0] || IBBNS;

		const req = xml(
			'iq',
			{ type: 'set', id, to },
			xml('si',
				{
					'xmlns': SINS,
					'id': sid,
					'mime-type': mimeType,
					'profile': SIPNS,
				},
				xml('file',
					{
						'xmlns': SIPNS,
						'name': fileName,
						'size': fileSize,
						date,
						hash,
					}),
				xml('feature',
					{
						'xmlns': SIFNNS,
					},
					xml('x',
						{
							'xmlns': DNS,
							'type': 'form',
						},
						xml('field',
							{
								'var': 'stream-method',
								'type': 'list-single',
							},
							xml('option', null,
								xml('value', null, preferredMethod),
							),
						),
					),
				),
			),
		);

		return iqCaller
			.request(req).then(res => {
				const values = parseValues(res);
				if (values[0] && values[0].text()) {
					return res;
				}
				throw res;
			});
	}

	onSIStreamInitiationRequest({stanza}) {
		const { from } = stanza.attrs;
		this.emit('incomingRequest', {from});
		const options = stanza.getChild('si').getChild('feature').getChild('x').getChild('field').getChildren('option');

		let preferredMethod = IBBNS;
		options.map((option) => {
			const value = option.getChildText('value');
			const index = this._supportedMethods.indexOf(value);
			if (index !== -1) {
				preferredMethod = this._supportedMethods[index];
			}
		});

		const res = xml('si',
			{
				'xmlns': SINS,
			},
			xml('feature',
				{
					'xmlns': SIFNNS,
				},
				xml('x',
					{
						'xmlns': DNS,
						'type': 'submit',
					},
					xml('field',
						{
							'var': 'stream-method',
						},
						xml('value', null, preferredMethod),
					),
				),
			),
		);
		return res;
	}
}

/**
 * Register a si plugin.
 *
 * @param {Client} client XMPP client instance
 * @returns {SIPlugin} Plugin instance
 */
function setupSI(client) {
	return new SIPlugin(client);
}

module.exports = setupSI;
