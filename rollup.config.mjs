// 导出defineConfig方法可以让编辑器（VSCode）智能提示所有的rollup的配置项，很方便
import { defineConfig } from 'rollup';
// rollup处理typescript的插件
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
// resolve将我们编写的源码与依赖的第三方库进行在之前的文章里面也有提到但是这里使用的@rollup/plugin-node-resolve
import resolve from '@rollup/plugin-node-resolve';
// 解决rollup.js无法识别CommonJS模块，这里使用的是@rollup/plugin-commonjs并不是之前提到的rollup-plugin-commonjs
import commonjs from '@rollup/plugin-commonjs';
// 引入package.json

// 拿到package.json的name属性来动态设置打包名称
export default defineConfig({
  input: 'src/extension.ts',
  output: [
    {
      dir: 'out',
      // file: `out/extension.js`,
      format: 'cjs',
      sourcemap: true
    },
  ],
  plugins: [
    commonjs(),
    json(),
    typescript({
      sourceMap: true,
    }),
    resolve(),
  ],
});
