export function snakeToCamel(str) {
  return str.replace(/_./g, (s) => s.charAt(1).toUpperCase());
}

export function camelToSnake(str) {
  return str.replace(/([A-Z])/g, (c) => '_' + c.toLowerCase());
}

function changeFormat(obj, transformer) {
  if(typeof obj === 'object') {
    if(obj === null) {
      return obj;
    }
    const formattedObj = Array.isArray(obj) ? [] : {};
    const keys = Object.keys(obj);
    keys.forEach((key) => {
      const value = obj[key];
      formattedObj[transformer(key)] = changeFormat(value, transformer);
    });
    return formattedObj;
  } else {
    return obj;
  }
}

export function camelKeys(obj) {
  return changeFormat(obj, snakeToCamel);
}

export function snakeKeys(obj) {
  return changeFormat(obj, camelToSnake);
}

const ALLOW_FORGERY_PROTECTION_METHODS = ['HEAD', 'TRACE'];
export function beforeSend(req) {
  if (ALLOW_FORGERY_PROTECTION_METHODS.includes(req.method.toUpperCase())) return;
  const el = document.querySelector('meta[name=csrf-token]');
  if (el && el.content) {
    req.headers['X-CSRF-Token'] = el.content;
  }
  req.headers['Cache-Control'] = 'no-store, no-cache';
  req.headers['Pragma'] = 'no-cache';
  return req;
}
