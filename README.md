# nock-sandbox
Clean up nock on demand, for example after each test. Helper function for mocha is provided.

## Installation
```
npm install --save-dev nock-sandbox
```

## Usage

```js
// some-file.spec.js

const nockSandbox = require('nock-sandbox');

describe('Some suite', function() {
  // sets up afterEach and beforeEach hooks 
  // beforeEach hook will prevent net connect except for localhost
  // afterEach will check if all nocks have been used - if not, it will cause the test to fail
  const nock = nockSandbox.setupForMocha(this);
  
  /* use nock here how you would use normally */
  /* 
});
```
