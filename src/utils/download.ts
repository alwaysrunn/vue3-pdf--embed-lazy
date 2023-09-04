export function downloadFile(data, fileName, fileType?) {
    // 创建一个包含数据的 Blob 对象
    const blob = new Blob([data], { type: fileType || 'application/octet-stream' });
  
    // 创建一个包含 Blob 对象的临时链接
  const url = URL.createObjectURL(blob);

    // 创建一个隐藏的 <a> 元素，并设置相关属性
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
  
    // 将链接元素添加到文档中
    document.body.appendChild(link);
  
    // 模拟点击链接以触发下载
    link.click();
  
    // 清理资源
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }