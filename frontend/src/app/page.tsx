export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to Ticket Exchange
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Buy and sell tickets for concerts, sports events, theater shows, and more.
          Safe, secure, and hassle-free ticket marketplace.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold mb-2">Browse Events</h3>
          <p className="text-gray-600">
            Discover tickets for thousands of events across various categories.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-xl font-semibold mb-2">Sell Tickets</h3>
          <p className="text-gray-600">
            List your tickets easily and reach thousands of potential buyers.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold mb-2">Secure Transactions</h3>
          <p className="text-gray-600">
            Protected payments and verified tickets for your peace of mind.
          </p>
        </div>
      </section>

      <section className="bg-primary-50 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Featured Events
        </h2>
        <p className="text-gray-600 mb-6">
          Coming soon! Check back later for the latest events and tickets.
        </p>
      </section>
    </div>
  );
}
