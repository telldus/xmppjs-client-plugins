
 */
// @flow
'use strict';

const {EventEmitter} = require('@xmpp/events');
const xml = require('@xmpp/xml');

const MDRNS = 'urn:xmpp:receipts';

const doesRequestReceipt = (stanza: Object): boolean => {
	if (!stanza.is('message')) {
		return false;
	}
	const child = stanza.getChild('request');
	return child && child.attrs.xmlns === MDRNS;
};

const isDeliveryReceipt = (stanza: Object): boolean => {
	if (!stanza.is('message')) {
		return false;
	}
	const child = stanza.getChild('received');
	return child && child.attrs.xmlns === MDRNS && child.attrs.id;
};

class MDRPlugin extends EventEmitter {
	constructor(client: Object) {
		super();
		this.client = client;
	}

	acknowledge(stanza: Object) {
		const { id, from } = stanza.attrs;
		const message = xml('message', {to: from, id: 'mdr'}, null,
			xml('received', {id, xmlns: MDRNS}),
			xml('store', {xmlns: 'urn:xmpp:hints'})
		);
		this.client.send(message);
	}

	handleReceipt(stanza: Object) {
		const child = stanza.getChild('received');
		const { from } = stanza.attrs;
		const { id } = child.attrs;
		this.emit('mdr.receipt', {
			from,
			id,
		});
	}
}

/**
 * Register a mdr plugin.
 *
 * @param {Client} client XMPP client instance
 * @returns {MDRPlugin} Plugin instance
 */

function setupMDR(client: Object): Object {
	const {middleware} = client;
	const plugin = new MDRPlugin(client);

	middleware.use(({stanza}: Object, next: Function): Function => {
		if (doesRequestReceipt(stanza)) {
			return plugin.acknowledge(stanza);
		}
		if (isDeliveryReceipt(stanza)) {
			return plugin.handleReceipt(stanza);
		}

		return next();
	});

	return plugin;
}

module.exports = {
	setupMDR,
	doesRequestReceipt,
	isDeliveryReceipt,
};
