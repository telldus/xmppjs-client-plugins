
'use strict';

const xml = require('@xmpp/xml');

const OfflineMessageRetrievalNS = 'http://jabber.org/protocol/offline';
const DiscoInfoNS = 'http://jabber.org/protocol/disco#info';
const DiscoItemsNS = 'http://jabber.org/protocol/disco#items';

class OfflineMessageRetrievalPlugin {
	constructor(client: Object) {
		this.client = client;
	}

	retrieveAll(): Promise<any> {
		const { iqCaller } = this.client;
		const req = xml('iq', {type: 'get', id: 'fetchalloffline'},
			xml('offline', {xmlns: OfflineMessageRetrievalNS},
				xml('fetch'),
			));
		return iqCaller.request(req);
	}

	removeAll(): Promise<any> {
		const { iqCaller } = this.client;
		const req = xml('iq', {type: 'set', id: 'removealloffline'},
			xml('offline', {xmlns: OfflineMessageRetrievalNS},
				xml('purge'),
			));
		return iqCaller.request(req);
	}

	requestMessagesCount(): Promise<any> {
		const { iqCaller } = this.client;
		const req = xml('iq', {type: 'get'},
			xml('query', {
				xmlns: DiscoInfoNS,
				node: OfflineMessageRetrievalNS}
			));
		return iqCaller.request(req);
	}

	requestMessageHeader(node: string): Promise<any> {
		const { iqCaller } = this.client;
		const req = xml('iq', {type: 'get'},
			xml('query', {
				xmlns: DiscoItemsNS,
				node: OfflineMessageRetrievalNS}
			));
		return iqCaller.request(req);
	}

	retrieveMessages(node: Array<string>, id: string): Promise<any> {
		const items = node.map((n: string): any => {
			return xml('item', {action: 'view', node});
		});
		const { iqCaller } = this.client;
		const req = xml('iq', {type: 'get', id},
			xml('offline', {xmlns: OfflineMessageRetrievalNS},
				...items,
			));
		return iqCaller.request(req);
	}

	removeMessages(node: Array<string>, id: string): Promise<any> {
		const items = node.map((n: string): any => {
			return xml('item', {action: 'remove', node});
		});
		const { iqCaller } = this.client;
		const req = xml('iq', {type: 'set', id},
			xml('offline', {xmlns: OfflineMessageRetrievalNS},
				...items,
			));
		return iqCaller.request(req);
	}
}

/**
 * Register a fomr plugin.
 *
 * @param {Client} client XMPP client instance
 * @returns {OfflineMessageRetrievalPlugin} Plugin instance
 */

function setupFOMR(client: Object): Object {
	const plugin = new OfflineMessageRetrievalPlugin(client);
	return plugin;
}

module.exports = {
	setupFOMR,
};
