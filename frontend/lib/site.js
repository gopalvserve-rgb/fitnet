// Brand & contact details. Change these to your own.
export const site = {
  name: 'Vows7',
  url: 'https://vows7.com',
  company: 'Vserve Ecommerce Sales and Services Pvt Ltd',
  founded: 2014,
  tagline: 'Destination Weddings · Jim Corbett & Delhi NCR',
  phone: '+91 72900 92222',
  whatsapp: '917290092222',
  email: 'hello@vows7.com',
  addressLines: [
    '2nd Floor, Ahinsa Compound, 485/11A',
    'Uberoi Compound, Ghisa, Dilshad Garden',
    'Delhi 110095',
  ],
  instagram: 'https://instagram.com/',
};

// Single-line address (for inline text and schema.org).
site.address = site.addressLines.join(', ');

export const nav = [
  { href: '/destinations/jim-corbett', label: 'Jim Corbett' },
  { href: '/destinations/delhi-ncr', label: 'Delhi NCR' },
  { href: '/venues', label: 'Venues' },
  { href: '/packages', label: 'Packages' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/** Years in business, so the "years of trust" figure stays correct every year. */
export const yearsOfTrust = () => new Date().getFullYear() - site.founded;
