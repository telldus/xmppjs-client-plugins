/**
 * Copyright 2016-present Telldus Technologies AB.
 *
 * This file is part of the Telldus Live! app.
 *
 * Telldus Live! app is free : you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Telldus Live! app is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Telldus Live! app.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
// @flow
'use strict';

const xml = require('@xmpp/xml');

const SOCKS5NS = 'http://jabber.org/protocol/bytestreams';
const DiscoItemsNS = 'http://jabber.org/protocol/disco#items';
const DiscoInfoNS = 'http://jabber.org/protocol/disco#info';

class SOCKS5Plugin {
	iqCaller: Object;
	constructor(client: Object) {
		this.iqCaller = client.iqCaller;
	}

	serviceDiscoveryRequest(to: string): Promise<any> {
		return this.discoInfoRequest(to).then((stanza: Object) => {
			this.checkIfSOCKS5IsSupported(stanza);
		});
	}

	checkIfSOCKS5IsSupported(stanza: Object) {
		const child = stanza.getChild('query');
		if (stanza.attrs.type === 'result' && child) {
			const features = child.getChildren('feature');
			features.map((f: Object) => {
				if (f.attrs.var === SOCKS5NS) {
					// SOCKS5 supported.
				}
			});
		}
	}

	serviceDiscoveryItemsRequest(domain: string): Promise<any> {
		return this.discoItemsRequest(domain).then((stanza: Object) => {
			const child = stanza.getChild('query');
			if (stanza.attrs.type === 'result' && child) {
				const items = child.getChildren('item');
				items.map((item: Object) => {
					this.discoInfoRequest(item.attrs.jid).then((stanzaOne: Object) => {
						if (this.checkIfProx(stanzaOne)) {
							this.getAddressFromProxy(item.attrs.jid).then((stanzaTwo: Object) => {
								const { host, port } = this.getHostAndPort(stanzaTwo);
								if (host && port) {
									// Initiate S5B request.
									this.initiateS5BRequest();
								}
							});
						}
					});
				});
			}
		});
	}

	initiateS5BRequest() {
	}

	getHostAndPort(stanza: Object): Object {
		const child = stanza.getChild('query');
		if (!child) {
			return {};
		}
		const streamhost = child.getChild('streamhost');
		if (!streamhost) {
			return {};
		}
		const host = streamhost.attrs.host;
		const port = streamhost.attrs.post;
		return { host, port };
	}

	checkIfProx(stanza: Object): boolean {
		const child = stanza.getChild('query');
		if (stanza.attrs.type === 'result' && child) {
			const identity = child.getChild('identity');
			return identity && identity.attrs.category === 'proxy';
		}
		return false;
	}

	getAddressFromProxy(to: string): Promise<any> {

		const req = xml('iq',
			{
				type: 'get',
				to,
			},
			xml('query', { xmlns: SOCKS5NS }));
		return this.iqCaller
			.request(req);
	}

	discoItemsRequest(to: string): Promise<any> {

		const req = xml('iq',
			{
				type: 'get',
				to,
			},
			xml('query', { xmlns: DiscoItemsNS }));
		return this.iqCaller
			.request(req);
	}

	discoInfoRequest(to: string): Promise<any> {

		const req = xml('iq',
			{
				type: 'get',
				to,
			},
			xml('query', { xmlns: DiscoInfoNS }));
		return this.iqCaller
			.request(req);
	}
}

/**
 * Register a SOCKS5 plugin.
 *
 * @param {Client} client XMPP client instance
 * @returns {SOCKS5Plugin} Plugin instance
 */
function setupSOCKS5(client: Object): Object {
	return new SOCKS5Plugin(client);
}

module.exports = setupSOCKS5;
