const routes: RouteConfig[] = [
  {
    name: 'Grid',
    path: '/grid',
    windowOptions: {
      title: '表格',
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      width: 300,
      height: 240,
    },
    createConfig: {
      hideMenus: true,
    },
  },
]

export default routes
