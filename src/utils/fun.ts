


import JSEncrypt from 'jsencrypt'
import { PUBLICK_KEY } from '/public/global.config.js'
import { cloneDeep, mapValues, isArray, isObject, isString, isFinite} from 'lodash';

/**
 * @description: 密码加密
 */
export function encrypt(txt: string) {
  const encryptor = new JSEncrypt()
  encryptor.setKey(PUBLICK_KEY)
  return encryptor.encrypt(txt)
}

//获取元素位置
export function getPosition({ parent, left, middle, right }) {
    const parentEl = document.getElementById(parent)?.getBoundingClientRect();
    const leftEl = document.getElementById(left)?.getBoundingClientRect();
    const middleEl = document.getElementById(middle)?.getBoundingClientRect();
    const rightEl = document.getElementById(right)?.getBoundingClientRect();
    const first = { x: leftEl.right - parentEl?.left, y: leftEl.bottom - parentEl?.top };
    const second = { x: middleEl.right - parentEl?.left, y: leftEl.bottom - parentEl?.top };
    const third = { x: rightEl.left - parentEl?.left, y: rightEl.bottom - parentEl?.top - rightEl?.height * 0.5 };
    
    return [first, second, third];
}

//生成svg矩形
export function createRectSvg(data, parentId) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let svgWidth = 0; // 初始化宽度为 0
    let svgHeight = 0; // 初始化高度为 0

    const parentEl = document.querySelector(parentId);

    // 根据数据数组生成矩形
    data.forEach(function(item) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const width = Math.abs(item.width);
      const height = Math.abs(item.height);
      const rectX = item.x - Math.min(...data.map(it => it.x));
      const rectY = item.y - Math.min(...data.map(it => it.y));
        rect.setAttribute("x", rectX); // 相对于元素的 x 坐标
        rect.setAttribute("y", rectY); // 相对于元素的 y 坐标
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        rect.setAttribute("fill", item.fill);
        svg.appendChild(rect);
         // 更新 SVG 的宽度和高度
        svgWidth = Math.max(svgWidth, rectX + width);
        svgHeight = Math.max(svgHeight, rectY + height);
    });
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);
    parentEl?.appendChild(svg);

    const minX = Math.min(...data.map(it => it.x));
    const minY = Math.min(...data.map(it => it.y));
    svg.style.position = "absolute";
    svg.style.left = minX + "px";
    svg.style.top = minY + "px";
}

//生成svg虚线
export function createDashedLineSvg(points, parentId?) {
    const svgEl = document.getElementById('lineSvg');
    svgEl && document.body.removeChild(svgEl);

        // 找到最大和最小的 x 值和 y 值
    const minX = Math.min(...points.map(point => point.x));
    const minY = Math.min(...points.map(point => point.y));
    const maxX = Math.max(...points.map(point => point.x));
    const maxY = Math.max(...points.map(point => point.y));

    // 计算 SVG 的宽度和高度
    const svgWidth = maxX - minX; // 初始化宽度为 0
    const svgHeight = maxY - minY; 

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);

    const parentEl = document.getElementById(parentId);
    const parentRect = parentEl?.getBoundingClientRect();

     // 循环创建路径元素
    for (let i = 0; i < points.length - 1; i++) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M${points[i].x - minX},${points[i].y - minY} L${points[i + 1].x - minX},${points[i + 1].y - minY}`;
        path.setAttribute("d", d);
        path.setAttribute("stroke", "#e34d59");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-dasharray", "3, 3"); // 设置虚线属性
        svg.appendChild(path);
    }

    svg.setAttribute("id", 'lineSvg');

    document.body.appendChild(svg);

    svg.style.position = "absolute";
    svg.style.left = minX + parentRect.left + "px";
    svg.style.top = minY + parentRect.top + "px";
}


export function getWsUrl() {
    let prefix = 'ws';
    if (location.protocol.includes('https')) {
        prefix = 'wss';
    }
    return `${prefix}://${location.host}/myWs`
    // return `ws://192.168.4.215:8788/myWs`
    // return `wss://duotougpt.wenge.com/myWs`
}

//转成formData 
export function convertObjectToFormData(obj: Object) {
    const formData = new FormData();
  
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        formData.append(key, obj[key]);
      }
    }
  
    return formData;
}


//字节数转化
export function formatFileSize(sizeInBytes: number) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let sizeValue = sizeInBytes;
    let unitIndex = 0;
  
    while (sizeValue >= 1024 && unitIndex < units.length - 1) {
      sizeValue /= 1024;
      unitIndex++;
    }
    return sizeValue.toFixed(2) + ' ' + units[unitIndex];
}

//表格索引
export function getIndex({ size, page, init }) {
  return (page - 1) * size + init + 1;
}

//fieldMap : { key, label, children}
export function treeToArray(tree, attr = 'children') {
  const stack = cloneDeep(tree),
    res = [];
  while (stack.length != 0) {
    const pop = stack.pop();
    res.push(pop);
    const children = pop[attr];
    if (children?.length) {
      stack.push(...children);
      delete pop[attr];
    }
  }
  return res;
}


export function convertArrayValuesToNumbers(obj) {
  return mapValues(obj, (value) => {
    if (isArray(value)) {
      return value.map((item) => {
        if (isObject(item)) {
          return convertArrayValuesToNumbers(item); // 递归处理嵌套对象
        } else if (isString(item) && isFinite(Number(item))) {
          return Number(item);
        }
        return item;
      });
    } else if (isObject(value)) {
      return convertArrayValuesToNumbers(value); // 递归处理嵌套对象
    }
    return value;
  });
}

