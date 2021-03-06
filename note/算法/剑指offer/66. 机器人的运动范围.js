/**
 * @Author nzq
 * @Date 19-6-19
 * [机器人的运动范围](https://www.nowcoder.com/practice/6e5207314b5241fb83f2329e89fdecc8?tpId=13&tqId=11219&rp=2&ru=/ta/coding-interviews&qru=/ta/coding-interviews/question-ranking)
 * @Description: 地上有一个m行和n列的方格。一个机器人从坐标0,0的格子开始移动，每一次只能向左，右，上，下四个方向移动一格，但是不能进入行坐标和列坐标的数位之和大于k的格子。 例如，当k为18时，机器人能够进入方格（35,37），因为3+5+3+7 = 18。但是，它不能进入方格（35,38），因为3+5+3+8 = 19。请问该机器人能够达到多少个格子？
 * @Param:
 * @Return:
 */
// 上下左右
const DIRECTION = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function sum(rest) {
  let count = 0;
  for (let i = 0, len = rest.length; i < len; i++) {
    count+= +rest[i];
  }
  return count;
}

function movingCount(threshold, rows, cols)
{
  // write code here
  if (threshold < 0) return 0;
  if (threshold === 0 && rows > 0 && cols > 0) return 1;
  let flag = [];
  return trval(0, 0, rows, cols, threshold, flag);
}

function trval (i, j, rows, cols, threshold, flag) {
  //　回调结束条件
  if (i < 0
    || i >= rows
    || j < 0
    || j >= cols
    || sum((i + '' + j).split('')) > threshold
    || flag[i * cols + j]
  ) {
    return 0;
  }

  let count = 0;
  flag[i * cols + j] = true;

  let r, c;
  for (let p = 0; p < DIRECTION.length; p++) {
    [r, c] = DIRECTION[p];
    count += trval(i+r, j+c, rows, cols, threshold, flag);
  }

  return count+1;
}
console.log(movingCount(1, 2,2))
