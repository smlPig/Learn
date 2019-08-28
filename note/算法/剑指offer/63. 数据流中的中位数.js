/**
 *
 [数据流中的中位数](https://www.nowcoder.com/practice/9be0172896bd43948f8a32fb954e1be1?tpId=13&tqId=11216&rp=2&ru=/ta/coding-interviews&qru=/ta/coding-interviews/question-ranking	)
如何得到一个数据流中的中位数？如果从数据流中读出奇数个数值，那么中位数就是所有数值排序之后位于中间的数值。如果从数据流中读出偶数个数值，那么中位数就是所有数值排序之后中间两个数的平均值。我们使用Insert()方法读取数据流，使用GetMedian()方法获取当前读取数据的中位数。
 * @method      GetMedian
 * @date        2019-06-19
 * @author NZQ
 * @constructor
 */
let arr = [];

// 思路一：插入的时候构建大顶堆
// 思路二: 插入的时候构建有序数组
function Insert(num) {
	// write code here
	arr.push(num);
}

function GetMedian() {
	// write code here
	arr.sort();
	let len = arr.length;
	return len % 2 === 0 ? (arr[len / 2 - 1] + arr[len / 2]) / 2 : arr[Math.floor(len / 2)]
}

// 思路二： 利用一个大顶堆（左）、一个小顶堆（右）
