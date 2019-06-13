'use strict'

const {EventEmitter} = require('@xmpp/events');
const xml = require('@xmpp/xml');
const JID = require('@xmpp/jid');

const IBBNS = 'http://jabber.org/protocol/ibb';

const isIBBSessionRequest = ({stanza}) => {
    const child = stanza.getChild('open');
    return stanza.attrs.type &&  stanza.attrs.type === 'set' && child && child.attrs.xmlns === IBBNS;
}

const isIBBData = ({stanza}) => {
    const child = stanza.getChild('data');
    return stanza.attrs.type && stanza.attrs.type === 'set' && child && child.attrs.xmlns === IBBNS;
}

class IBBPlugin extends EventEmitter {
    constructor(client) {
      super();
      this.client = client;
    }

    sendSessionRequest(from, to, id, sid, blockSize) {
        const { iqCaller } = this.client;
        return iqCaller
        .request(
            xml(
                'iq',
                { type: 'set', to, id, from },
                xml('open', {
                    'xmlns': IBBNS,
                    'block-size': blockSize,
                    sid,
                    'stanza': 'iq',
                }),
            )
        );
    }

    confirmSessionRequest({stanza}) {
        const { iqCaller } = this.client;
        const { from, to, id } =  stanza.attrs;
        return iqCaller
        .request(
            xml(
                'iq',
                { type: 'result', from: to, to: from, id },
            )
        );
    }

    sendByteStream(from, to, id, sid, rid, blockSize, data) {
        return this.sendSessionRequest(from, to, rid, sid, blockSize).then((res) => {
            const { from: From, id: ID, type } = res.attrs;
            if (From === to && rid === ID && type === 'result') {
                return this.sendData(from, to, id, sid, data);
            } else {
                throw res;
            }
        });
    }

    sendData(from, to, id, sid, data) {
        const { iqCaller } = this.client;
        return iqCaller
        .request(
            xml(
                'iq',
                { type: 'set', to, id, from },
                xml('data', {
                    'xmlns': IBBNS,
                    'seq': '0',
                    sid,
                }, data),
            )
        );
    }

    handleIBBData({stanza}) {
        const { from, to, id } = stanza.attrs;
        const data = stanza.getChild("data");
        this.emit('IBBSuccess', {data: data.text(), from, seq: data.attrs.seq});
        this.acknowledgeDataReception(from, to, id);
    }

    acknowledgeDataReception(to, from, id) {
        const { iqCaller } = this.client;
        return iqCaller
        .request(
            xml(
                'iq',
                { type: 'result', to, id, from },
            )
        );
    }

    sendClose() {
    }

    receiveClose() {
    }
}

/**
 * Register a ibb plugin.
 *
 * @param {Client} client XMPP client instance
 * @returns {IBBPlugin} Plugin instance
 */

function setupIBB(client) {
    const plugin = new IBBPlugin(client);
    const {middleware} = client;

    middleware.use((context, next) => {
        if (isIBBSessionRequest(context)) {
            return plugin.confirmSessionRequest(context);
        }
        if (isIBBData(context)) {
            return plugin.handleIBBData(context);
        }

        return next();
    });

    return plugin;
}

module.exports = setupIBB;