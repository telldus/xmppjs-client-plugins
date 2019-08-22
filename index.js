import setupIBB from './packages/xep-0047-ibb';
import setupSI from './packages/xep-0096-si';
import * as OMEMO from './packages/xep-0384-omemo';
import setupCSN from './packages/xep-0085-chatstate';
import setupSOCKS5 from './packages/xep-0065-socks5';

module.exports = {
	setupIBB,
	setupSI,
	setupCSN,
	setupSOCKS5,
	...OMEMO,
};
