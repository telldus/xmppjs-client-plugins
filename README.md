# xmppjs-client-plugins

Set of plugins for [xmppjs](https://github.com/xmppjs/xmpp.js)

* [XEP-0013 - Flexible Offline Message Retrieval](https://xmpp.org/extensions/xep-0013.html)(v1.2)
* [XEP-0047 - In-Band Bytestreams](https://xmpp.org/extensions/xep-0047.html)(v2.0)
* [XEP-0065 - SOCKS5](https://xmpp.org/extensions/xep-0065.html)(v1.8.1)
* [XEP-0085 - Chat State Notification](https://xmpp.org/extensions/xep-0085.html)(v2.1)
* [XEP-0096 - SI File Transfer](https://xmpp.org/extensions/xep-0096.html)(v1.3)
* [XEP-0184 - Message Delivery Receipts](https://xmpp.org/extensions/xep-0184.html)(v1.4.0)
* [XEP-0384 - OMEMO](https://xmpp.org/extensions/xep-0384.html)(v0.3.0)


## Usage:

#### OMEMO [OUTDATED - There has been some additions and namespace changes in the protocol]

```javascript

import {
  client,
} from "@xmpp/client";
import {
  setupOMEMO,
} from 'xmppjs-client-plugins';


// Set up the plugin
const xmpp = client({service: 'wss://xmpp.example.com'});
const omemoPlugin = setupOMEMO(xmpp);

// Announce OMEMO support, and publish the current/latest devices list and each device's bundle info
OMEMOPlugin.announceOMEMOSupport(myDevicesArray, myBareJid)
OMEMOPlugin.announceBundleInfo(payload, deviceId, bareJid).then((res: any): any => {
}).catch((err: any): any => {
});

// Set listener
OMEMOPlugin.on('omemo.devicelist', (deviceList: Object) => {
});

// Subscribe to contact's devices list update If not already subscribed
OMEMOPlugin.subscribeToDeviceListUpdate(fromFullJid, toBareJid).then((stanza: Object): Object => {
  const child = stanza.getChild('pubsub');
  if (!child || stanza.attrs.type !== 'result') {
    return stanza;
  }
  const subscription = child.getChild('subscription');
  if (subscription && subscription.attrs.subscription) {
    // Cache subscription status
  }
  return stanza;
});

// Subscribe to contact's device's bundle update If not already subscribed
OMEMOPlugin.subscribeToBundleUpdate(fromFullJid, toBareJid, deviceId).then((stanza: Object): Object => {
  const child = stanza.getChild('pubsub');
  if (!child || stanza.attrs.type !== 'result') {
    return stanza;
  }
  const subscription = child.getChild('subscription');
  if (subscription && subscription.attrs.subscription && subscription.attrs.node) {
    // Cache subscription status
  }
  return stanza;
});

// Request for contact's devices list on demand
omemoPlugin.requestDeviceList(fromFullJid, toBareJid).then((deviceList: Object) => {
  // Cache devices
}).catch((err) => {
});

// Request for contact's device's bundle on demand
OMEMOPlugin.requestBundle(bareFromJid, bareToJid, deviceId).then((bundle: Object): any => {
  // Cache bundle
});

// Send encrypted message
const fromJid = "";
const toJid = "";
const chatType = "chat";
const encryptionPayload = {
  ciphertext: "",
  iv: "",
  keys: [{
    prekey: "",
    key: "",
    deviceId: "",
  }],
};
const messageId = "unique_messgae_id"; // set as `id` on <message> element
const sid = ""; // `sid` set on <header> element
const otherElements = [
  xml('active', {
    xmlns: "http://jabber.org/protocol/chatstates",
  })
]; // Any other supported xml elements, say chat state.

OMEMOPlugin.sendMessage(fromJid, toJid, chatType, encryptionPayload, messageId, sid, otherElements).then(() => {
});

// Message reception can be handle inside xmpp client's "on('stanza', async (stanza: any) => {})" listener as usual. Check for "encrypted" child element.

```
