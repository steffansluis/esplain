let explanation = require('./explanation');

const compose = (fn, ...fns) => {
  if (!fns.length) return fn;

  return (...args) => {
    const nextFn = fns.unshift();
    const res = fn(...args);
    return compose(nextFn, fns)(res);
  }
}

const matchers = {
  sum: /sum of:/i,
  product: /product of:/i,
  match: /match on/i,
  field: /\[PerFieldSimilarity\]/i,
  norm: /norm/i,
  boost: /boost/i,
  idf: /idf\(.*\)/,
  tf: /tf\(.*\)/,
}

const parsers = {
  // sum: (x) => x.description,
  default: (x) => `${x.value} ==> ${x.description}`
}

const rewriters = {
  sum: (x) => {
    console.log(`Applying sum rewrite`);

    if (!hasDetails(x)) return x;

    const details = x.details.filter( y => y.value !== 0);
    if (details.length === 1) return details[0];

    console.log(`Reduced amount of children from ${x.details.length} to ${details.length}`);
    return Object.assign({}, x, { details });
  },
  product: (x) => {
    console.log(`Applying product rewrite with ${x.details.length} children`);
    if (x.details.length > 1) return x;

    console.log(`Rewrote product node to child`);
    return x.details[0];
  },
  default: (x) => x
}

const SPACER = '  ';

const hasDetails = (x) => {
  return x.details.length;
}

const typeOf = (x) => {
  return Object.keys(matchers).find(key => {
    return x.description.match(matchers[key]);
  });
}

const rewrite = (x) => {
  if (hasDetails(x)) {
    const details = x.details.reverse().map(rewrite).filter(y => y != null);
    x = Object.assign({}, x, { details });
  }

  const type = typeOf(x);
  console.log(`Rewriting ${type}`);
  if (type in rewriters) return rewriters[type](x) || rewriters.default(x);
  return rewriters.default(x);
}

const parse = (x) => {
  const type = typeOf(x);
  if (type in parsers) return parsers[type](x);
  return parsers.default(x);
}

const indent = (s, depth = 0) => {
  let indentation = new Array(depth).fill(SPACER).join('');
  return `${indentation}${s}`;
}

const format = (exp, options = { depth: 0 }) => {
  let { depth } = options;
  var result = parse(exp);

  if (exp.details.length) {
    let subresult = exp.details.map( y => {
      depth += 1;
      return indent(format(y, { depth }), depth);
    }).join('\n');

    return `${result}\n${subresult}`;
  }

  return result;
}

// const format = (explanation) => {
//
// }
//
// const depthFirst = (node, isLeafNode, mapFn, reduceFn, memo = Object.create(null)) => {
//   if (!ifLeafNode(node)) {
//     return x.details.map( mapFn ).reduce(reduceFn, memo);
//   }
//   return mapFn(node);
// }

// console.log(format(rewrite(explanation)));
console.log(format(explanation));
