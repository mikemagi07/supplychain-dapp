import { useState } from "react";
import { PRODUCT_TEMPLATES, ProductTemplate, getTemplatesByCategory } from "../data/productTemplates";

type ProductTemplateSelectorProps = {
  onSelectTemplate: (template: ProductTemplate) => void;
  onClose: () => void;
};

export default function ProductTemplateSelector({
  onSelectTemplate,
  onClose,
}: ProductTemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = Array.from(new Set(PRODUCT_TEMPLATES.map((t) => t.category)));

  const filteredTemplates = selectedCategory
    ? PRODUCT_TEMPLATES.filter((t) => t.category === selectedCategory)
    : PRODUCT_TEMPLATES;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Select Product Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded text-sm ${
              selectedCategory === null
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded text-sm ${
                selectedCategory === category
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Template List */}
        <div className="space-y-2">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              onClick={() => {
                onSelectTemplate(template);
                onClose();
              }}
              className="bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors border border-gray-600 hover:border-blue-500"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">{template.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Category: {template.category}</span>
                    <span>Default Qty: {template.defaultQuantity}</span>
                  </div>
                </div>
                <button
                  className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTemplate(template);
                    onClose();
                  }}
                >
                  Use Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <p className="text-gray-400 text-center py-8">No templates found in this category</p>
        )}
      </div>
    </div>
  );
}

