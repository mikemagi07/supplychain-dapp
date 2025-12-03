// Product templates for quick creation
// Producers can select from these templates and customize

export type ProductTemplate = {
  id: string;
  name: string;
  description: string;
  defaultQuantity: number;
  category: string;
};

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  // Electronics
  {
    id: "iphone-15",
    name: "iPhone 15 Pro",
    description: "Apple iPhone 15 Pro - 256GB, Titanium Blue",
    defaultQuantity: 50,
    category: "Electronics",
  },
  {
    id: "samsung-s24",
    name: "Samsung Galaxy S24 Ultra",
    description: "Samsung Galaxy S24 Ultra - 512GB, Phantom Black",
    defaultQuantity: 30,
    category: "Electronics",
  },
  {
    id: "macbook-pro",
    name: "MacBook Pro 16-inch",
    description: "Apple MacBook Pro 16-inch M3 Pro - 1TB SSD",
    defaultQuantity: 20,
    category: "Electronics",
  },
  
  // Food & Beverages
  {
    id: "organic-apples",
    name: "Organic Red Apples",
    description: "Fresh organic red apples - 1kg pack",
    defaultQuantity: 100,
    category: "Food & Beverages",
  },
  {
    id: "coffee-beans",
    name: "Premium Coffee Beans",
    description: "Arabica coffee beans - 500g bag",
    defaultQuantity: 200,
    category: "Food & Beverages",
  },
  
  // Clothing
  {
    id: "cotton-tshirt",
    name: "Organic Cotton T-Shirt",
    description: "100% organic cotton t-shirt - Medium size",
    defaultQuantity: 150,
    category: "Clothing",
  },
  {
    id: "denim-jeans",
    name: "Classic Denim Jeans",
    description: "Premium denim jeans - Size 32",
    defaultQuantity: 80,
    category: "Clothing",
  },
  
  // Home & Garden
  {
    id: "indoor-plant",
    name: "Indoor Plant Set",
    description: "Set of 3 indoor plants with pots",
    defaultQuantity: 60,
    category: "Home & Garden",
  },
  
  // Health & Beauty
  {
    id: "vitamin-c",
    name: "Vitamin C Supplement",
    description: "1000mg Vitamin C tablets - 60 count",
    defaultQuantity: 120,
    category: "Health & Beauty",
  },
];

export const getTemplatesByCategory = (): Record<string, ProductTemplate[]> => {
  const grouped: Record<string, ProductTemplate[]> = {};
  PRODUCT_TEMPLATES.forEach((template) => {
    if (!grouped[template.category]) {
      grouped[template.category] = [];
    }
    grouped[template.category].push(template);
  });
  return grouped;
};

