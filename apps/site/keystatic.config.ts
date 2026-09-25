import { collection, config, fields, singleton } from '@keystatic/core';

const listOfText = (label: string, itemLabel: string) =>
  fields.array(
    fields.text({ label: itemLabel }),
    {
      label,
      itemLabel: ({ value }) => value || itemLabel,
    },
  );

const content = fields.mdx({
  label: 'Content',
  extension: 'md',
});

export default config({
  storage: {
    kind: 'local',
  },
  ui: {
    brand: {
      name: 'peteryates.net',
    },
  },
  collections: {
    posts: collection({
      label: 'Posts',
      path: 'src/content/posts/*',
      slugField: 'title',
      columns: ['title', 'publishedAt', 'draft'],
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { isRequired: true },
          },
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
          validation: { isRequired: true },
        }),
        publishedAt: fields.date({
          label: 'Published date',
          validation: { isRequired: true },
        }),
        updatedAt: fields.date({
          label: 'Updated date',
        }),
        tags: listOfText('Tags', 'Tag'),
        draft: fields.checkbox({
          label: 'Draft',
          description: 'Draft posts are hidden from the production site.',
          defaultValue: false,
        }),
        content,
      },
    }),
    projects: collection({
      label: 'Projects',
      path: 'src/content/projects/*',
      slugField: 'title',
      columns: ['title', 'status', 'startedAt'],
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { isRequired: true },
          },
        }),
        description: fields.text({
          label: 'Description',
          multiline: true,
          validation: { isRequired: true },
        }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Active', value: 'active' },
            { label: 'Work in progress', value: 'wip' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'wip',
        }),
        repo: fields.url({
          label: 'Repository URL',
        }),
        url: fields.url({
          label: 'Project URL',
        }),
        tech: listOfText('Technologies', 'Technology'),
        startedAt: fields.date({
          label: 'Started date',
          validation: { isRequired: true },
        }),
        content,
      },
    }),
    photography: collection({
      label: 'Photography',
      path: 'src/content/photography/*',
      slugField: 'title',
      columns: ['title', 'date'],
      format: { contentField: 'emptyContent' },
      schema: {
        title: fields.slug({
          name: {
            label: 'Title',
            validation: { isRequired: true },
          },
        }),
        date: fields.date({
          label: 'Date',
          validation: { isRequired: true },
        }),
        url: fields.url({
          label: 'Gallery URL',
          validation: { isRequired: true },
        }),
        emptyContent: fields.emptyContent({ extension: 'md' }),
      },
    }),
  },
  singletons: {
    homepage: singleton({
      label: 'Homepage',
      path: 'src/content/pages/home',
      format: { contentField: 'emptyContent' },
      schema: {
        title: fields.text({
          label: 'Page title',
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: 'Meta description',
          multiline: true,
          validation: { isRequired: true },
        }),
        intro: fields.text({
          label: 'Introduction',
          multiline: true,
        }),
        showLatestGallery: fields.checkbox({
          label: 'Show latest gallery',
          defaultValue: true,
        }),
        featuredGallery: fields.relationship({
          label: 'Featured gallery',
          description: 'Leave empty to use the newest gallery automatically.',
          collection: 'photography',
        }),
        latestGalleryHeading: fields.text({
          label: 'Gallery section heading',
          validation: { isRequired: true },
        }),
        allPhotographyLabel: fields.text({
          label: 'All photography link',
          validation: { isRequired: true },
        }),
        galleryCta: fields.text({
          label: 'Gallery button',
          validation: { isRequired: true },
        }),
        recentPostsHeading: fields.text({
          label: 'Posts section heading',
          validation: { isRequired: true },
        }),
        allPostsLabel: fields.text({
          label: 'All posts link',
          validation: { isRequired: true },
        }),
        emptyPostsMessage: fields.text({
          label: 'No posts message',
          validation: { isRequired: true },
        }),
        recentPostCount: fields.integer({
          label: 'Number of recent posts',
          defaultValue: 5,
          validation: { min: 1, max: 20 },
        }),
        emptyContent: fields.emptyContent({ extension: 'md' }),
      },
    }),
    about: singleton({
      label: 'About page',
      path: 'src/content/pages/about',
      format: { contentField: 'content' },
      schema: {
        title: fields.text({
          label: 'Page title',
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: 'Meta description',
          multiline: true,
          validation: { isRequired: true },
        }),
        content: fields.mdx({
          label: 'Page content',
          extension: 'md',
        }),
      },
    }),
    headshots: singleton({
      label: 'Headshots page',
      path: 'src/content/pages/headshots',
      format: { contentField: 'emptyContent' },
      schema: {
        title: fields.text({
          label: 'Page title',
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: 'Meta description',
          multiline: true,
          validation: { isRequired: true },
        }),
        tagline: fields.text({
          label: 'Tagline',
          multiline: true,
          validation: { isRequired: true },
        }),
        location: fields.text({
          label: 'Location',
          multiline: true,
          validation: { isRequired: true },
        }),
        contactEmail: fields.text({
          label: 'Contact email',
          description: 'Used for booking when a package has no booking link.',
          validation: { isRequired: true },
        }),
        packages: fields.array(
          fields.object({
            name: fields.text({
              label: 'Name',
              validation: { isRequired: true },
            }),
            price: fields.integer({
              label: 'Price (AUD)',
              validation: { isRequired: true, min: 0 },
            }),
            duration: fields.text({
              label: 'Duration',
              validation: { isRequired: true },
            }),
            delivery: fields.text({
              label: 'Delivery time',
              validation: { isRequired: true },
            }),
            highlighted: fields.checkbox({
              label: 'Highlight this package',
              defaultValue: false,
            }),
            bookingUrl: fields.text({
              label: 'Booking link',
              description: 'Cal.com event link. Leave empty to book by email.',
            }),
            features: listOfText('Features', 'Feature'),
          }),
          {
            label: 'Packages',
            itemLabel: ({ fields }) => fields.name.value || 'Package',
          },
        ),
        steps: fields.array(
          fields.object({
            title: fields.text({
              label: 'Title',
              validation: { isRequired: true },
            }),
            body: fields.text({
              label: 'Body',
              multiline: true,
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'How it works',
            itemLabel: ({ fields }) => fields.title.value || 'Step',
          },
        ),
        faq: fields.array(
          fields.object({
            question: fields.text({
              label: 'Question',
              validation: { isRequired: true },
            }),
            answer: fields.text({
              label: 'Answer',
              multiline: true,
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'FAQ',
            itemLabel: ({ fields }) => fields.question.value || 'Question',
          },
        ),
        photos: fields.array(
          fields.object({
            src: fields.text({
              label: 'Image path or URL',
              description: 'e.g. /headshots/example-1.jpg in the public folder.',
              validation: { isRequired: true },
            }),
            alt: fields.text({
              label: 'Alt text',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Example photos',
            itemLabel: ({ fields }) => fields.alt.value || 'Photo',
          },
        ),
        emptyContent: fields.emptyContent({ extension: 'md' }),
      },
    }),
    siteSettings: singleton({
      label: 'Site settings',
      path: 'src/content/settings/site',
      format: { contentField: 'emptyContent' },
      schema: {
        siteName: fields.text({
          label: 'Site name',
          validation: { isRequired: true },
        }),
        defaultDescription: fields.text({
          label: 'Default meta description',
          multiline: true,
          validation: { isRequired: true },
        }),
        footerName: fields.text({
          label: 'Footer name',
          validation: { isRequired: true },
        }),
        navigation: fields.array(
          fields.object({
            label: fields.text({
              label: 'Label',
              validation: { isRequired: true },
            }),
            href: fields.text({
              label: 'Path or URL',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Navigation',
            itemLabel: ({ fields }) => fields.label.value || 'Navigation link',
          },
        ),
        socialLinks: fields.array(
          fields.object({
            label: fields.text({
              label: 'Label',
              validation: { isRequired: true },
            }),
            href: fields.text({
              label: 'URL',
              validation: { isRequired: true },
            }),
          }),
          {
            label: 'Footer links',
            itemLabel: ({ fields }) => fields.label.value || 'Footer link',
          },
        ),
        emptyContent: fields.emptyContent({ extension: 'md' }),
      },
    }),
  },
});
