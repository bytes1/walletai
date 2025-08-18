"use client";

type StockProps = {
  price: number;
  symbol: string;
};

export const Crypto = ({ price, symbol }: StockProps) => {
  return (
    <div className="max-w-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg p-6 text-white transform transition-all duration-300 hover:scale-105">
      <h2 className="text-2xl font-bold mb-4">Crypto Information</h2>
      <div className="space-y-3">
        <p className="text-lg font-semibold">
          <span className="text-gray-200">Symbol:</span>{" "}
          <span className="text-yellow-300">{symbol}</span>
        </p>
        <p className="text-lg font-semibold">
          <span className="text-gray-200">Price:</span>{" "}
          <span className="text-green-400">${price.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
};
