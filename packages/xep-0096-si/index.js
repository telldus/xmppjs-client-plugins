'use strict'

const {EventEmitter} = require('@xmpp/events');
const xml = require('@xmpp/xml');
const JID = require('@xmpp/jid');

const SINS = 'http://jabber.org/protocol/si';
const SIPNS = 'http://jabber.org/protocol/si/profile/file-transfer';
const SIFNNS = 'http://jabber.org/protocol/feature-neg';
const DNS = 'jabber:x:data';

const IBBNS = 'http://jabber.org/protocol/ibb';
const BSNS = 'http://jabber.org/protocol/bytestreams';

const isSIStreamInitiationRequest = ({stanza}) => {
    const child = stanza.getChild("si");
    const feature = child.getChild("feature");
    const check1 = child.attrs.profile === SIPNS && feature.attrs.xmlns === SIFNNS;

    const x = feature.getChild("x");
    if (!x) {
        return false;
    }
    const field = x.getChild("field");
    if (!field) {
        return false;
    }
    const option = field.getChild("option");
    if (!option) {
        return false;
    }

    const check2 = x.attrs.type === 'form';

    return check1 && check2;
}

const parseValues = stanza => {
    const c1 = stanza.getChild('si');
    if (c1.getChild('feature')) {
        return c1.getChild('feature').getChild('x').getChild('field').getChildren('value');
    }
    return null;
}

class SIPlugin extends EventEmitter {
    constructor(client) {
        super();
        this.client = client;
        this.init();
    }

    init() {
        const { iqCallee } = this.client;
        iqCallee.set(SINS, 'si', ctx => {
            if (isSIStreamInitiationRequest(ctx)) {
                this.onSIStreamInitiationRequest(ctx);
            }
        });
    }

    send(id, sid, to, fileSize, fileName, mimeType, date, hash) {
        const { iqCaller } = this.client;

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
                                xml('value', null, IBBNS),
                            ),
                        ),
                    ),
                ),
            ),
        );

        return iqCaller
        .request(req).then(res => {
            const { from: FROM, id: ID } = res.attrs;
            const values = parseValues(res);
            if (values[0] && values[0].text()) {
                return res;
            }
            throw res;
        });
    }

    onSIStreamInitiationRequest({stanza}) {
        const { iqCaller } = this.client;
        const { from, id } = stanza.attrs;
        this.emit('incomingRequest', {from});
        const options = stanza.getChild('si').getChild('feature').getChild('x').getChild('field').getChildren('option');

        let hasIBB = false;
        options.map((option) => {
            const value = option.getChildText("value");
            if (value === IBBNS) {
                hasIBB = true;
            }
        });

        const acceptedMeth = hasIBB ? IBBNS : undefined;

        const res = xml(
            'iq',
            { type: 'result', id, to: from },
            xml('si',
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
                            xml('value', null, acceptedMeth),
                        ),
                    ),
                ),
            ),
        );
        return iqCaller
        .request(res);
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
