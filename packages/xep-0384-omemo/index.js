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

const	PubSubEventNS = 'http://jabber.org/protocol/pubsub#event';
const	PubSubNS = 'http://jabber.org/protocol/pubsub';
const	OMEMODeviceListNodeNS = 'eu.siacs.conversations.axolotl.devicelist';
const	OMEMODeviceListNS = 'eu.siacs.conversations.axolotl';
const	ExplicitEncryptionNS = 'urn:xmpp:eme:0';

const BundleInfoNode = 'eu.siacs.conversations.axolotl.bundles:';

const isOMEMODeviceList = (stanza: Object): boolean => {
	const child = stanza.getChild('event') || stanza.getChild('pubsub');
	if (!child) {
		return false;
	}
	const items = child.getChild('items');
	if (!items) {
		return false;
	}
	const item = items.getChild('item');
	if (!item) {
		return false;
	}
	const list = item.getChild('list');

	return list && (list.attrs.xmlns === OMEMODeviceListNS) &&
	(child.attrs.xmlns === PubSubEventNS || child.attrs.xmlns === PubSubNS) &&
	(items.attrs.node === OMEMODeviceListNodeNS);
};

const preparePayloadDeviceList = (stanza: Object): Object => {
	const { from: jid, type } = stanza.attrs;
	const child = stanza.getChild('event') || stanza.getChild('pubsub');
	const items = child.getChild('items');
	const list = items.getChild('item').getChild('list');
	const devices = list.getChildren('device') || [];

	const payload = {
		jid,
		type,
		devices: devices.map((d: Object): number => {
			const { id } = d.attrs;
			return id;
		}),
	};
	return payload;
};

const isOMEMOBundle = (stanza: Object): boolean => {
	const child = stanza.getChild('event') || stanza.getChild('pubsub');
	if (!child) {
		return false;
	}
	const items = child.getChild('items');
	if (!items) {
		return false;
	}
	const item = items.getChild('item');
	if (!item) {
		return false;
	}
	const bundle = item.getChild('bundle');

	return bundle && bundle.attrs.xmlns === OMEMODeviceListNS &&
	(child.attrs.xmlns === PubSubEventNS || child.attrs.xmlns === PubSubNS);
};

const preparePayloadBundle = (stanza: Object, deviceId?: string): Object => {
	const { from: jid, type } = stanza.attrs;
	const child = stanza.getChild('event') || stanza.getChild('pubsub');
	const items = child.getChild('items');
	const bundle = items.getChild('item').getChild('bundle');

	const signedPreKeyPublic = bundle.getChild('signedPreKeyPublic');
	const signedPreKeySignature = bundle.getChild('signedPreKeySignature');
	const identityKey = bundle.getChild('identityKey');

	const prekeys = bundle.getChild('prekeys');
	const preKeyPub = prekeys.getChildren('preKeyPublic');

	deviceId = deviceId ? deviceId : items.attrs.node.split(':')[1];

	const payload = {
		jid,
		type,
		prekeys: preKeyPub.map((pkp: Object): Object => {
			return {
				preKeyPublic: pkp.text(),
				preKeyId: pkp.attrs.preKeyId,
			};
		}),
		identityKey: identityKey.text(),
		signedPreKeySignature: signedPreKeySignature.text(),
		signedPreKeyPublic: signedPreKeyPublic.text(),
		signedPreKeyId: signedPreKeyPublic.attrs.signedPreKeyId,
		deviceId,
	};
	return payload;
};

export type KeysRecord = {
	prekey: string,
	key: string,
	deviceId: string,
};

export type KeysType = Array<KeysRecord>;

export type EncryptionPayloadType = {
	ciphertext: string,
	iv: string,
	keys: KeysType,
};

class OMEMOPlugin extends EventEmitter {
iqCaller: Object;

constructor(client: Object) {
	super();
	this.client = client;
}

sendMessage(from: string, to: string, type: 'chat' | 'groupchat' | 'normal', encryptionPayload: EncryptionPayloadType, id: number, sid: number, otherElements: Array<Object>): Promise<any> {
	let encryptionXML = xml('encryption', {
		xmlns: ExplicitEncryptionNS,
		name: 'OMEMO',
		namespace: OMEMODeviceListNS,
	});
	const { ciphertext, iv, keys } = encryptionPayload;
	const keysXML = keys.map((kInfo: Object): any => {
		const { prekey, key, deviceId: rid } = kInfo;
		return xml('key', {prekey, rid}, key);
	});
	let ivXML = xml('iv', null, iv);

	const req = xml('message',
		{
			to,
			from,
			id,
			type,
		},
		xml('encrypted', { xmlns: OMEMODeviceListNS },
			xml('header', { sid },
				keysXML,
				ivXML
			),
			xml('payload', null, ciphertext)
		),
		encryptionXML,
		...otherElements,
	);
	return this.client.send(req);
}

handleDeviceList(stanza: Object) {
	const payload = preparePayloadDeviceList(stanza);
	this.emit('omemo.devicelist', payload);
}

/**
 *
 * @param {string} from : full JID of local user.
 * @param {string} to : Bare JID of remote contact.
 */
async subscribeToDeviceListUpdate(from: string, to: string): Promise<any> {
	const { iqCaller } = this.client;
	const message = xml('iq',
		{
			xmlns: 'jabber:client',
			type: 'set',
			from,
			to,
		},
		xml('pubsub', { xmlns: PubSubNS },
			xml('subscribe', { node: OMEMODeviceListNodeNS, jid: from.split('/')[0] },
			)));
	return await iqCaller.request(message);
}

/**
 *
 * @param {string} from : full JID of local user.
 * @param {string} to : Bare JID of remote contact.
 */
async subscribeToBundleUpdate(from: string, to: string, deviceId: string): Promise<any> {
	const { iqCaller } = this.client;
	const message = xml('iq',
		{
			xmlns: 'jabber:client',
			type: 'set',
			from,
			to,
		},
		xml('pubsub', { xmlns: PubSubNS },
			xml('subscribe', { node: BundleInfoNode + deviceId, jid: from.split('/')[0] },
			)));
	return await iqCaller.request(message);
}

requestDeviceList(from: string, to: string): any {
	const req = xml('iq',
		{
			xmlns: 'jabber:client',
			type: 'get',
			from,
			to,
		},
		xml('pubsub', { xmlns: PubSubNS },
			xml('items', { node: OMEMODeviceListNodeNS},
			)));

	return this.client.iqCaller
		.request(req).then((res: Object): any => {
			if (isOMEMODeviceList(res)) {
				return preparePayloadDeviceList(res);
			}
			return res;
		});
}

requestBundle(from: string, to: string, deviceId: string): any {
	const req = xml('iq',
		{
			type: 'get',
			from,
			to,
		},
		xml('pubsub', { xmlns: PubSubNS },
			xml('items', { node: BundleInfoNode + deviceId},
			)));
	return this.client.iqCaller
		.request(req).then((res: Object): any => {
			if (isOMEMOBundle(res)) {
				return preparePayloadBundle(res, deviceId);
			}
			return res;
		});
}

announceOMEMOSupport(deviceList: Array<string>, from: string): Promise<any> {
	const devices = deviceList.map((id: string): Object => {
		return xml('device', {id});
	});
	const req = xml('iq',
		{
			type: 'set',
			from,
		},
		xml('pubsub', { xmlns: PubSubNS },
			xml('publish', { node: OMEMODeviceListNodeNS},
				xml('item', { id: 'current' },
					xml('list', { xmlns: OMEMODeviceListNS},
						...devices,
					)))));
	return this.client.iqCaller
		.request(req);
}

announceBundleInfo(data: Object, deviceId: string, from: string): Promise<any> {
	const {
		signedPreKeyPublic,
		signedPreKeyId,
		signedPreKeySignature,
		identityKey,
		preKeysPublic,
	} = data;
	const prekeys = preKeysPublic.map(({preKeyPublic, preKeyId}: Object): Object => {
		return xml('preKeyPublic', {preKeyId}, preKeyPublic);
	});
	const req = xml('iq',
		{
			type: 'set',
			from,
		},
		xml('pubsub', { xmlns: PubSubNS },
			xml('publish', { node: BundleInfoNode + deviceId},
				xml('item', { id: 'current'},
					xml('bundle', { xmlns: OMEMODeviceListNS},
						xml('signedPreKeyPublic', {signedPreKeyId}, signedPreKeyPublic),
						xml('signedPreKeySignature', null, signedPreKeySignature),
						xml('identityKey', null, identityKey),
						xml('prekeys', null,
							...prekeys,
						))))));
	return this.client.iqCaller
		.request(req);
}
}

/**
 * Register a OMEMOPlugin Encryption plugin.
 *
 * @param {Client} client XMPP client instance
 * @returns {OMEMOPlugin} Plugin instance
 */

function setupOMEMO(client: Object): Object {
	const {middleware} = client;
	const plugin = new OMEMOPlugin(client);

	middleware.use(({stanza}: Object, next: Function): Function => {
		// TODO 101 : Investigate, Middleware part not called for device list updation 'message' stanza
		// Hence event 'omemo.devicelist' will not be fired.
		if (isOMEMODeviceList(stanza)) {
			return plugin.handleDeviceList(stanza);
		}

		return next();
	});

	return plugin;
}

module.exports = {
	setupOMEMO,
	isOMEMODeviceList,
	preparePayloadDeviceList,
	isOMEMOBundle,
	preparePayloadBundle,
};
