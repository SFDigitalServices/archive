module.exports = {
  expandEnvVars,
  unique
}

function expandEnvVars (str, vars = process.env) {
  return str
    .replace(/\$\{(\w+)\}/g, (_, key) => vars[key] || '')
    .replace(/\$(\w+)/g, (_, key) => vars[key] || '')
}

function unique (value, index, list) {
  return list.indexOf(value) === index
}
