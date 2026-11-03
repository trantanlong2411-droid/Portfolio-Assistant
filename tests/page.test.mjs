import test from 'node:test';import assert from 'node:assert/strict';
import {Script} from 'node:vm';import {HTML} from '../src/page.mjs';
test('Portfolio demo supports 5+ questions, two protocols, export and warnings',()=>{
 for(const text of ['Where is my USDC?','What am I earning?','biggest position',
 'RockawayX USDC Vault','Centrifuge deJTRSY','Export latest JSON evidence','contract sources'])
  assert.ok(HTML.toLowerCase().includes(text.toLowerCase()),text);
});
test('Frontend script parses safely',()=>{
 const s=HTML.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(s);new Script(s[1]);
});
