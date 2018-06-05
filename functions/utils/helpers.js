exports.removeDuplicates = arr => arr.filter((ele, i, self) => i === self.indexOf(ele));
