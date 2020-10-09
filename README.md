# xmppjs-client-plugins

Set of plugins for [xmppjs](https://github.com/xmppjs/xmpp.js)

* [XEP-0013 - Flexible Offline Message Retrieval](https://xmpp.org/extensions/xep-0013.html)
* [XEP-0047 - In-Band Bytestreams](https://xmpp.org/extensions/xep-0047.html)
* [XEP-0065 - SOCKS5](https://xmpp.org/extensions/xep-0065.html)
* [XEP-0085 - Chat State Notification](https://xmpp.org/extensions/xep-0085.html)
* [XEP-0096 - SI File Transfer](https://xmpp.org/extensions/xep-0096.html)
* [XEP-0184 - Message Delivery Receipts](https://xmpp.org/extensions/xep-0184.html)
* [XEP-0384 - OMEMO](https://xmpp.org/extensions/xep-0384.html)


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

// Call methods
omemoPlugin.requestDeviceList(fromFullJID, toBareJID).then((deviceList: Object) => {
}).catch((err) => {
});

// Set listener
OMEMOPlugin.on('omemo.devicelist', (deviceList: Object) => {
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
