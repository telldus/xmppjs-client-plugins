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

```

import {
  client,
} from "@xmpp/client";
import {
  setupOMEMO,
} from 'xmppjs-client-plugins';


const xmpp = client({service: 'wss://xmpp.example.com'});
const omemoPlugin = setupOMEMO(xmpp);

// Set listener
OMEMOPlugin.on('omemo.devicelist', (deviceList: Object) => {
});

OMEMOPlugin.announceOMEMOSupport(myDevicesArray, myBareJid)

// Call methods
omemoPlugin.requestDeviceList(fromFullJID, toBareJID).then((deviceList: Object) => {
}).catch((err) => {
});

OMEMOPlugin.requestBundle(bareFrom, bareTo, deviceId).then((bundle: Object): any => {
});


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


```
