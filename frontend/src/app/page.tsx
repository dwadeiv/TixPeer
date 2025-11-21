export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to TixPeer
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The peer-to-peer marketplace connecting fans directly. Buy, sell, and trade tickets with other fans—no middleman, just community.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🤝</div>
          <h3 className="text-xl font-semibold mb-2">Direct Exchange</h3>
          <p className="text-gray-600">
            Connect directly with other fans. No platform fees, no inventory—just peer-to-peer trading.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold mb-2">List Your Tickets</h3>
          <p className="text-gray-600">
            Post tickets you want to sell or trade. Set your price and connect with interested buyers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🌐</div>
          <h3 className="text-xl font-semibold mb-2">Community Marketplace</h3>
          <p className="text-gray-600">
            Browse listings from real fans. Negotiate, barter, and make deals in a trusted community space.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          How TixPeer Works
        </h2>
        <p className="text-gray-600 mb-6">
          We provide the platform, you make the connections. List your tickets, browse what others are offering, and negotiate directly. TixPeer simply brings fans together—all transactions happen peer-to-peer.
        </p>
      </section>
    </div>
  );
}
