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
const {EventEmitter} = require('@xmpp/events');
const xml = require('@xmpp/xml');

const ChatStateNS = 'http://jabber.org/protocol/chatstates';

class ChatStateNotificationsPlugin extends EventEmitter {
	constructor(client: Object) {
		super();
		this.client = client;
	}

	handleChatStateNotification(stanza: Object) {
		const { from: jid, type } = stanza.attrs;
		const payload = {
			jid,
			type,
		};
		if (stanza.getChild('composing')) {
			this.emit('chatstate.composing', payload);
		}
		if (stanza.getChild('paused')) {
			this.emit('chatstate.paused', payload);
		}
		if (stanza.getChild('active')) {
			this.emit('chatstate.active', payload);
		}
		if (stanza.getChild('inactive')) {
			this.emit('chatstate.inactive', payload);
		}
		if (stanza.getChild('gone')) {
			this.emit('chatstate.gone', payload);
		}
	}

	sendComposing(jid: string, type: string = 'chat') {
		this.sendStateNotification(jid, type, 'composing');
	}

	sendPaused(jid: string, type: string = 'chat') {
		this.sendStateNotification(jid, type, 'paused');
	}

	sendActive(jid: string, type: string = 'chat') {
		this.sendStateNotification(jid, type, 'active');
	}

	sendInactive(jid: string, type: string = 'chat') {
		this.sendStateNotification(jid, type, 'inactive');
	}

	sendGone(jid: string, type: string = 'chat') {
		this.sendStateNotification(jid, type, 'gone');
	}

	sendStateNotification(to: string, type: string, state: string) {
		const msg = xml('message', {
			type,
			to,
		},
		xml(state, {
			'xmlns': ChatStateNS,
		}));
		this.client.send(msg);
	}

}

/**
 * Register a ChatStateNotifications plugin.
 *
 * @param {Client} client XMPP client instance
 * @returns {ChatStateNotificationsPlugin} Plugin instance
 */

function setupCSN(client: Object): Object {
	const {middleware} = client;
	const plugin = new ChatStateNotificationsPlugin(client);

	middleware.use(({stanza}: Object, next: Function): Function => {
		if (stanza.is('message')) {
			return plugin.handleChatStateNotification(stanza);
		}

		return next();
	});

	return plugin;
}

module.exports = setupCSN;
