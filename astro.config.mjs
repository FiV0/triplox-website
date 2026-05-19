import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import starlightBlog from 'starlight-blog';
import starlightThemeBlack from 'starlight-theme-black';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  integrations: [
    starlight({
      title: 'Triplox',
      logo: {
        light: './src/assets/blocks_logo.svg',
        dark: './src/assets/blocks_logo_dark.svg',
        replacesTitle: false,
      },
      customCss: ['./src/styles/colors.css', 'katex/dist/katex.min.css'],
      components: {
        Sidebar: './src/components/Sidebar.astro',
        PageTitle: './src/components/PageTitle.astro',
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
            { label: 'Life of a transaction', slug: 'transactions/life-of-a-transaction' },
            { label: 'Transaction Model', slug: 'transactions/transaction-model' },
            { label: 'Schema', slug: 'transactions/schema' },
            { label: 'Transaction Data', slug: 'transactions/transaction-data' },
            { label: 'Partitions', slug: 'transactions/partitions' },
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
          label: 'Incremental Queries',
          collapsed: true,
          items: [
            { label: 'Overview', slug: 'incremental-queries/overview' },
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
        {
          label: 'Roadmap',
          collapsed: true,
          items: [
            { label: 'Roadmap', slug: 'roadmap/roadmap' },
            { label: 'Open questions', slug: 'roadmap/open-questions' },
          ],
        },
      ],
    }),
  ],
});
