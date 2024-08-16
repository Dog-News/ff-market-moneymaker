export default {
  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'ff-big-money-maker',
    htmlAttrs: {
      lang: 'en'
    },
    bodyAttrs: {
      class: []
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' },
      { name: 'format-detection', content: 'telephone=no' }
    ],
    script: [
			{ async: false, src: 'https://kit.fontawesome.com/aea73eff9e.js',}
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },

  // turn off server side rendering
  // ssr: false,

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@fortawesome/fontawesome-svg-core/styles.css'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    '~/plugins/event-bus.js',
    '~/plugins/fontawesome.js'
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  target: 'static',
  buildModules: [
    '@nuxt/image'
  ],
  image: {
    //Options
    // domains: ['localhost']
  },
  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    'bootstrap-vue/nuxt',
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios',
    'nuxt-socket-io',
  ],

  //Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: 'http://localhost:4001',
  },

  io: {
    // Options
    sockets: [{ name: 'admin', url: 'http://localhost:4001/' }],
  },

  // proxy: {
  //   //'/api/': 'https://universalis.app/api/'
  // },

  // Build Configuration: https://go.nuxtjs.dev/config-build
   build: {
      transpile: [
        '@fortawesome/vue-fontawesome',
        '@fortawesome/fontawesome-svg-core',
        '@fortawesome/pro-solid-svg-icons',
        '@fortawesome/pro-regular-svg-icons',
        '@fortawesome/free-brands-svg-icons',
'@awesome.me/kit-aea73eff9e/icons',
      ]
    },

  loading: {
    color: 'blue',
    height: '10px'
  }
}
