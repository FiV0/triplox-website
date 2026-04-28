import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightBlog from 'starlight-blog';
import starlightThemeBlack from 'starlight-theme-black';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Triplox',
      logo: {
        src: './src/assets/logo.png',
        replacesTitle: false,
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/FiV0/triplox-website',
        },
        {
          icon: 'discord',
          label: 'Discord',
          href: 'https://discord.gg/your-invite',
        },
      ],
      plugins: [
        starlightThemeBlack({
          navLinks: [
            { label: 'Docs', link: '/getting-started/' },
            { label: 'Blog', link: '/blog/' },
          ],
          footerText: '',
        }),
        starlightBlog(),
      ],
      sidebar: [
        {
          label: 'Start here',
          items: [
            { label: 'Getting started', slug: 'getting-started' },
          ],
        },
      ],
    }),
  ],

  adapter: cloudflare(),
});