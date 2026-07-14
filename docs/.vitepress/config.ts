import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'VGate',
  titleTemplate: ':title · VGate',
  description:
    'VGate is a self-hosted, open-source VLESS proxy management system. Manage proxy nodes, users, subscriptions, billing, and traffic in one place.',

  // Served as a GitHub Pages org/user site at the root: https://vgate-project.github.io/
  base: '/',

  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3c8dbc' }],
    ['meta', { property: 'og:title', content: 'VGate — Self-hosted VLESS Proxy Management' }],
    ['meta', { property: 'og:description', content: 'Manage VLESS proxy nodes, users, subscriptions, billing, and traffic from a single control plane.' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/favicon.svg',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Features', link: '/guide/features' },
      { text: 'Architecture', link: '/guide/architecture' },
      { text: 'Get Started', link: '/guide/getting-started' },
      {
        text: 'Components',
        items: [
          { text: 'Overview', link: '/components/' },
          { text: 'Manager (Backend API)', link: '/components/manager' },
          { text: 'Server (Proxy Node)', link: '/components/server' },
          { text: 'Admin Console', link: '/components/admin-console' },
          { text: 'User Portal', link: '/components/user-portal' },
        ],
      },
      {
        text: 'Operations',
        items: [
          { text: 'Deployment', link: '/operations/deployment' },
          { text: 'Configuration Reference', link: '/operations/configuration' },
          { text: 'API Reference', link: '/operations/api' },
          { text: 'FAQ', link: '/operations/faq' },
        ],
      },
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'GitHub', link: 'https://github.com/vgate-project', target: '_blank' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is VGate?', link: '/guide/what-is-vgate' },
            { text: 'Features', link: '/guide/features' },
            { text: 'Architecture', link: '/guide/architecture' },
            { text: 'Core Concepts', link: '/guide/concepts' },
            { text: 'Use Cases', link: '/guide/use-cases' },
          ],
        },
        {
          text: 'Get Started',
          items: [
            { text: 'Quick Start', link: '/guide/getting-started' },
          ],
        },
      ],
      '/components/': [
        {
          text: 'Components',
          items: [
            { text: 'Overview', link: '/components/' },
            { text: 'Manager (Backend API)', link: '/components/manager' },
            { text: 'Server (Proxy Node)', link: '/components/server' },
            { text: 'Admin Console', link: '/components/admin-console' },
            { text: 'User Portal', link: '/components/user-portal' },
          ],
        },
      ],
      '/operations/': [
        {
          text: 'Operations',
          items: [
            { text: 'Deployment', link: '/operations/deployment' },
            { text: 'Configuration Reference', link: '/operations/configuration' },
            { text: 'API Reference', link: '/operations/api' },
            { text: 'Security', link: '/operations/security' },
            { text: 'Troubleshooting', link: '/operations/troubleshooting' },
            { text: 'FAQ', link: '/operations/faq' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vgate-project' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Licensed under AGPL-3.0.',
      copyright: 'Copyright © 2024–2026 VGate Project',
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },

    outline: {
      label: 'On this page',
      level: [2, 3],
    },

    lastUpdatedText: 'Last updated',
    returnToTopLabel: 'Back to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Theme',
    lightModeSwitchTitle: 'Switch to light theme',
    darkModeSwitchTitle: 'Switch to dark theme',
  },
})
