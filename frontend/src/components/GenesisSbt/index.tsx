"use client";

import { useState } from "react";

// --- SVG Icon Components (replaces react-icons) ---

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4 text-yellow-300"
  >
    <path
      fillRule="evenodd"
      d="M10.868 2.884c.321-.662 1.215-.662 1.536 0l1.681 3.462 3.996.611c.734.112 1.022 1.012.473 1.534l-2.89 2.97.772 4.072c.123.65-.642 1.15-1.226.862L10 15.228l-3.645 1.98c-.584.318-1.35-.212-1.226-.862l.772-4.072-2.89-2.97c-.549-.522-.261-1.422.473-1.534l3.996-.611L10.868 2.884z"
      clipRule="evenodd"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="w-4 h-4"
  >
    <path
      fillRule="evenodd"
      d="M10 1.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 1.5zM5.028 4.165a.75.75 0 011.06 0l1.06 1.06a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 010-1.06zM14.972 4.165a.75.75 0 00-1.06 0l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06a.75.75 0 000-1.06zM17.25 10a.75.75 0 010 1.5h-1.5a.75.75 0 010-1.5h1.5zM4.25 10a.75.75 0 010 1.5h-1.5a.75.75 0 010-1.5h1.5zM10 17.25a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75zM6.089 13.911a.75.75 0 001.06 0l1.06-1.06a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 000 1.06zM13.911 13.911a.75.75 0 010-1.06l1.06-1.06a.75.75 0 011.06 1.06l-1.06 1.06a.75.75 0 01-1.06 0z"
      clipRule="evenodd"
    />
    <path d="M10 4a6 6 0 100 12 6 6 0 000-12zM3.293 6.707a8 8 0 0113.414 0L10 16.707 3.293 6.707z" />
  </svg>
);

const KycStatusIcon = ({ verified }: { verified: boolean }) =>
  verified ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4 text-green-400"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="w-4 h-4 text-yellow-400"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );

// --- Prop Types ---

interface NftAttribute {
  trait_type: string;
  value: string;
}

interface GenesisSbtProps {
  name: string;
  tokenId: string;
  description: string;
  image_uri: string;
  attributes: NftAttribute[];
  kycVerified: boolean;
}

// --- Main Component ---

export const GenesisSbt = (props: GenesisSbtProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const backgroundStyle = {
    background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(147, 51, 234, 0.2), transparent 80%)`,
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="group relative max-w-sm mx-auto rounded-3xl border border-white/10 bg-gray-900/60 p-1.5 backdrop-blur-xl transition-all duration-300 ease-out hover:border-purple-500/50"
    >
      {/* Aurora glow effect */}
      <div
        style={backgroundStyle}
        className="absolute inset-0 rounded-3xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
      />

      {/* Main Content */}
      <div className="relative bg-gray-900 rounded-[20px] p-6 transform transition-transform duration-300 ease-out group-hover:scale-[1.02]">
        {/* Image Section */}
        <div className="relative mb-4">
          <img
            src={props.image_uri}
            alt={props.name}
            className="w-full h-auto rounded-2xl shadow-lg border-2 border-purple-500/30"
          />
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <StarIcon />
            <span>#{props.tokenId}</span>
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-xs font-medium">
            <ShieldIcon />
            <span>Soulbound</span>
          </div>
        </div>

        {/* Title and Description */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight mb-1 text-white">{props.name}</h2>
          <p className="text-gray-400 text-sm">{props.description}</p>
        </div>

        {/* Attributes Section */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {props.attributes.map((attr, index) => (
            <div
              key={index}
              className="bg-black/30 rounded-lg p-3 text-center transition-colors duration-300 group-hover:bg-purple-900/20"
            >
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {attr.trait_type}
              </h3>
              <p className="text-md font-semibold truncate text-white">{attr.value}</p>
            </div>
          ))}
        </div>

        {/* KYC Status Section */}
        <div
          className={`flex items-center justify-center gap-2 p-3 rounded-lg text-sm transition-colors duration-300 ${
            props.kycVerified
              ? "bg-green-500/10 text-green-400"
              : "bg-yellow-500/10 text-yellow-400"
          }`}
        >
          <KycStatusIcon verified={props.kycVerified} />
          <span className="font-semibold">
            {props.kycVerified ? "KYC Verified" : "KYC Not Verified"}
          </span>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button className="w-full text-center bg-purple-600/50 text-purple-200 font-semibold py-2.5 rounded-lg border border-purple-500/50 transition-all duration-300 ease-out hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-500/30">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};
