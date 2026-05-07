import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Shield, Truck, HeadphonesIcon, Star, ChevronRight } from 'lucide-react';
import { PRODUCT_IMAGES } from '../../utils/constants';
import { useStore } from '../../hooks/useStore';
import ProductCard from '../../components/ProductCard';

const LandingPage: React.FC = () => {
  const { products } = useStore();
  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const topSelling = products.filter((p) => p.topSelling).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px'}} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-primary-100 px-4 py-2 rounded-full mb-6 text-sm">
                <Sparkles className="w-4 h-4 text-accent-400" />
                <span>Premium Cleaning Solutions</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
                Wipe It <span className="text-accent-400">Good</span>
                <br />
                <span className="text-primary-200">Trading</span>
              </h1>
              <p className="text-primary-100 text-lg max-w-lg mb-8 leading-relaxed">
                Discover premium cleaning products that make your home sparkle. 
                From surface cleaners to professional kits — quality you can trust.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-8 py-3.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
                >
                  Shop Now <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-xl font-semibold transition backdrop-blur-sm border border-white/20"
                >
                  Browse Catalog
                </Link>
              </div>
            </div>
            <div className="relative animate-slide-up hidden lg:block">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={PRODUCT_IMAGES.hero}
                  alt="Clean home"
                  className="w-full h-[400px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-900/40 to-transparent" />
              </div>
              {/* Floating Stats */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 animate-fade-in" style={{animationDelay:'0.3s'}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-primary-600 fill-primary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">4.8/5</p>
                    <p className="text-xs text-gray-500">Customer Rating</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 animate-fade-in" style={{animationDelay:'0.5s'}}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-accent-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">10K+</p>
                    <p className="text-xs text-gray-500">Orders Delivered</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z" fill="#f8faf9" />
          </svg>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-10 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Truck, title: 'Fast Delivery', desc: 'Nationwide shipping' },
              { icon: Shield, title: 'Quality Assured', desc: '100% genuine products' },
              { icon: HeadphonesIcon, title: '24/7 Support', desc: 'Always here to help' },
              { icon: Star, title: 'Best Prices', desc: 'Competitive pricing' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-500 mt-1">Handpicked for quality and performance</p>
            </div>
            <Link to="/products" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold text-sm transition">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="py-16 bg-[#f8faf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl overflow-hidden p-8 sm:p-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px'}} />
            </div>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-block bg-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
                  Limited Offer
                </span>
                <h3 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                  Get 20% Off Your First Order!
                </h3>
                <p className="text-primary-100 mb-6 max-w-md">
                  Sign up today and enjoy an exclusive discount on your first purchase. Quality cleaning starts here.
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition shadow-lg"
                >
                  Create Account <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="hidden lg:block">
                <img
                  src={PRODUCT_IMAGES.hero2}
                  alt="Cleaning promotion"
                  className="rounded-2xl shadow-xl w-full h-[250px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Selling */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Top Selling Products</h2>
              <p className="text-gray-500 mt-1">Our customers' favorites</p>
            </div>
            <Link to="/products" className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold text-sm transition">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {topSelling.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f8faf9]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Sparkles className="w-10 h-10 text-primary-500 mx-auto mb-4" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Ready to Make Your Home Sparkle?
          </h2>
          <p className="text-gray-500 mb-8 max-w-lg mx-auto">
            Join thousands of satisfied customers who trust Wipe It Good Trading for their cleaning needs.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-8 py-3.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl"
          >
            Start Shopping <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
