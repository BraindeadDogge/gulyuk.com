// Raw text imports (`import html from './x.html?raw'`) are handled by Vite and arrive as strings.
declare module '*.html?raw' {
  const html: string
  export default html
}
