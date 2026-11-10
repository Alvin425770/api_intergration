function deprecate({ sunset, link }) {
  return (req, res, next) => {
    res.set('Deprecation', 'true');
    res.set('Sunset', new Date(sunset).toUTCString());
    res.set('Link', `<${link}>; rel="deprecation"`);
    next();
  };
}

module.exports = deprecate;