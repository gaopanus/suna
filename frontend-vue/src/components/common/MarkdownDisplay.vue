<template>
  <div class="markdown-display" v-html="renderedMarkdown"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps({
  markdown: {
    type: String,
    required: true,
    default: ''
  },
  // Options for DOMPurify, if you want to customize allowed tags/attributes
  domPurifyConfig: {
    type: Object,
    default: () => ({
        USE_PROFILES: { html: true }, // Allow common HTML tags
        // FORBID_TAGS: ['style'], // Example: forbid style tags
        // ADD_ATTR: ['target'], // Example: allow target attribute for links
    })
  }
});

// Configure marked (optional, can be done globally too)
// Example: Enable GitHub Flavored Markdown (GFM)
marked.setOptions({
  gfm: true,
  breaks: true, // Add <br> on single line breaks
  pedantic: false,
  // sanitize: false, // Deprecated and not recommended. Use DOMPurify instead.
});

const renderedMarkdown = computed(() => {
  if (!props.markdown) {
    return '';
  }
  // 1. Convert Markdown to HTML using marked
  const dirtyHtml = marked.parse(props.markdown);

  // 2. Sanitize the HTML using DOMPurify
  // This is crucial to prevent XSS attacks if markdown comes from untrusted sources.
  return DOMPurify.sanitize(dirtyHtml, props.domPurifyConfig);
});
</script>

<style>
/* Add global styles for rendered markdown elements here or in a global CSS file */
/* These styles will apply to any v-html content rendered by this component */
.markdown-display {
  line-height: 1.7;
  word-wrap: break-word; /* Ensure long words don't overflow */
}

.markdown-display h1,
.markdown-display h2,
.markdown-display h3,
.markdown-display h4,
.markdown-display h5,
.markdown-display h6 {
  margin-top: 1.2em;
  margin-bottom: 0.6em;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-display h1 { font-size: 2em; }
.markdown-display h2 { font-size: 1.5em; }
.markdown-display h3 { font-size: 1.25em; }
.markdown-display h4 { font-size: 1em; }
.markdown-display h5 { font-size: 0.875em; }
.markdown-display h6 { font-size: 0.85em; color: #666; }

.markdown-display p {
  margin-bottom: 1em;
}
.markdown-display p:last-child {
  margin-bottom: 0;
}


.markdown-display ul,
.markdown-display ol {
  padding-left: 2em;
  margin-bottom: 1em;
}
.markdown-display li > p { /* Paragraphs inside list items */
    margin-bottom: 0.5em;
}


.markdown-display blockquote {
  margin: 0 0 1em 0;
  padding: 0.5em 1em;
  border-left: 0.25em solid #dfe2e5; /* Vuetify's border color could be used */
  color: #6a737d; /* Vuetify's secondary text color */
  background-color: rgba(var(--v-theme-on-surface), 0.03);
}
.markdown-display blockquote > :first-child {
    margin-top: 0;
}
.markdown-display blockquote > :last-child {
    margin-bottom: 0;
}

.markdown-display pre {
  background-color: rgba(var(--v-theme-on-surface), 0.04);
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  padding: 1em;
  overflow: auto;
  border-radius: 6px;
  margin-bottom: 1em;
  line-height: 1.45;
}

.markdown-display code {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  border-radius: 3px;
}
.markdown-display pre > code { /* Code inside pre should not have its own background or padding */
  padding: 0;
  margin: 0;
  font-size: inherit;
  background-color: transparent;
  border-radius: 0;
}


.markdown-display table {
  border-collapse: collapse;
  width: auto; /* Or 100% if you want full-width tables */
  margin-bottom: 1em;
  display: block; /* For responsiveness */
  overflow-x: auto; /* For responsiveness */
}
.markdown-display th,
.markdown-display td {
  border: 1px solid #dfe2e5; /* Vuetify border color */
  padding: 0.5em 0.75em;
}
.markdown-display th {
  font-weight: bold;
  background-color: rgba(var(--v-theme-on-surface), 0.03);
}

.markdown-display img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
}

.markdown-display a {
  color: rgb(var(--v-theme-primary)); /* Vuetify primary color */
  text-decoration: none;
}
.markdown-display a:hover {
  text-decoration: underline;
}

.markdown-display hr {
    height: .25em;
    padding: 0;
    margin: 24px 0;
    background-color: #e1e4e8; /* Vuetify border color */
    border: 0;
}
</style>
