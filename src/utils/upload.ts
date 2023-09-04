import axios from 'axios';
import { message } from 'ant-design-vue'
import { ContentTypeEnum } from '@/utils/enums/httpEnum'



function uploadFile<T>(config: any, params?: any, ): Promise<T> {
  const formData = new window.FormData();
    //文件上传的，把文件名加入文件内

  for (const key in params.data) {
    formData.append([key], params.data[key]);
  }

  for (const file of params.files) {
    formData.append('file', file as any);
  }

  return axios.request<T>({
    ...config,
    method: 'POST',
    data: formData,
    headers: {
      'Content-type': ContentTypeEnum.FORM_DATA,
    },
  });
}

export default uploadFile