function create(arr) {
  if (!(arr.length && arr[0] !== 0)) {
    return null;
  }
  let root = {};
  let temp = "";

  function _create(arr, tree) {
    temp = arr.shift();
    if (arr.length && temp !== 0) {
      tree.data = temp;
      tree.left = {};
      tree.right = {};
      _create(arr, tree.left);
      _create(arr, tree.right);
    } else {

    }
  }
  _create(arr, root);
  return root;
}
console.log(create(['A', 'B', 'D', 'H', 0, 'K', 0, 0, 0, 'E', 0, 0, 'C', 'F', 'I', 0, 0, 0, 'G', 0, 'J', 0, 0]))
