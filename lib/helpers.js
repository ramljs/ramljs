function coalesce(...values) {
  let l = values.length;
  for (let i = 0; i < l; i++) {
    let v = values[i];
    if (v != null)
      return v;
  }
}

module.exports =
    {
      coalesce
    };
