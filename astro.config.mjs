import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightBlog from 'starlight-blog';
import starlightThemeBlack from 'starlight-theme-black';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Triplox',
      logo: {
        src: './src/assets/blocks_logo.svg',
        replacesTitle: false,
      },
      customCss: ['./src/styles/colors.css'],
      components: {
        Sidebar: './src/components/Sidebar.astro',
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/FiV0/triplox/',
        },
        {
          icon: 'discord',
          label: 'Discord',
          href: 'https://discord.gg/CYaAYFwC',
        },
      ],
      plugins: [
        starlightThemeBlack({
          navLinks: [
            { label: 'Docs', link: '/getting-started/introduction/' },
            { label: 'Blog', link: '/blog/' },
          ],
          footerText: '',
        }),
        starlightBlog({ navigation: 'none' }),
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', slug: 'getting-started/introduction' },
            { label: 'Quick Start', slug: 'getting-started/quick-start' },
            { label: 'Architecture', slug: 'getting-started/architecture' },
          ],
        },
        {
          label: 'Data Model',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'data-model/overview' },
          ],
        },
        {
          label: 'Transactions',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'transactions/overview' },
          ],
        },
        {
          label: 'Query Language',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'query-language/overview' },
          ],
        },
        {
          label: 'Streaming Queries',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'streaming-queries/overview' },
          ],
        },
        {
          label: 'Operations',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'operations/overview' },
          ],
        },
        {
          label: 'APIs',
          collapsed: true,
          items: [
            { label: 'Clojure', slug: 'apis/clojure' },
            { label: 'Rust', slug: 'apis/rust' },
            { label: 'Java', slug: 'apis/java' },
          ],
        },
      ],
    }),
  ],
});
