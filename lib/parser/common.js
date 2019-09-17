const fs = require('fs');
const util = require('util');
const path = require('path');
const isPlainObject = require('putil-isplainobject');

const _readFile = util.promisify(fs.readFile);

async function resolveFile(filename, ctx = {}) {
  if (ctx.resolveFile)
    return ctx.resolveFile(filename, ctx);

  let f = path.isAbsolute(filename) ? path.join(ctx.rootPath, filename) :
      path.join(ctx.currentPath, filename);

  if (ctx.cache[f])
    return ctx.cache[f];

  if (path.extname(f).toLowerCase() === '.js')
    return require(f);
  if (!fs.existsSync(f) && path.extname(f) === '')
    f += '.raml';
  const result = _readFile(f, 'utf8');
  ctx.cache[f] = result;
  return result;
}

async function deepResolvePromises(obj) {
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++)
      obj[i] = await deepResolvePromises(obj[i]);
    return obj;
  }
  if (isPlainObject(obj)) {
    for (const key of Object.keys(obj)) {
      obj[key] = await deepResolvePromises(obj[key]);
    }
    return obj;
  }
  return await obj;
}

module.exports = {
  resolveFile,
  deepResolvePromises
};
