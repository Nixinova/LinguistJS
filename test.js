import linguist from './index.js';

const results = ({ count, languages }) => console.log({ count, languages });
linguist().then(results);
linguist('./node_modules/.bin', { keepVendored: true, checkAttributes: true }).then(results);
