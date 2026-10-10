// Brand & contact details. Change these to your own.
export const site = {
  name: 'Vows7',
  url: 'https://vows7.com',
  company: 'Vserve Ecommerce Sales and Services Pvt Ltd',
  founded: 2014,
  tagline: 'Destination Weddings · Jim Corbett & Delhi NCR',
  phone: '+91 98100 00000',
  whatsapp: '919810000000',
  email: 'hello@vows7.com',
  address: 'Saket, New Delhi 110017',
  instagram: 'https://instagram.com/',
};

export const nav = [
  { href: '/destinations/jim-corbett', label: 'Jim Corbett' },
  { href: '/destinations/delhi-ncr', label: 'Delhi NCR' },
  { href: '/venues', label: 'Venues' },
  { href: '/packages', label: 'Packages' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/** Years in business, so the "legacy" figure stays correct every year. */
export const yearsOfLegacy = () => new Date().getFullYear() - site.founded;
