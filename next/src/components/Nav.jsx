import Link from 'next/link';
import * as Sentry from '@sentry/react';
import Image from 'next/image';

import { connect } from 'react-redux';
import { resetCart, addProduct, setProducts } from '../actions';

import EPlogo from '../../public/empowerplant-logo.svg';

function Nav({ cart, frontendSlowdown }) {
  return (
    <>
      <nav id="top-nav" className="show-mobile">
        <div className="nav-contents">
          <Link href="/" id="home-link">
            <Image src={EPlogo} className="logo sentry-unmask" alt="logo" />
          </Link>

          <div id="top-right-links">
            <Link href="/about" className="sentry-unmask">
              About
            </Link>
            <Link href="/products" className="sentry-unmask">
              Products
            </Link>
            <Link href="/cart" className="sentry-unmask">
              Cart
              {cart.items.length > 0 ? (
                <span>
                  <span className="sentry-unmask"> ($</span>
                  <span className="sentry-mask">{cart.total}.00</span>
                  <span className="sentry-unmask">)</span>
                </span>
              ) : (
                ''
              )}
            </Link>
          </div>
        </div>
      </nav>

      <nav id="top-nav" className="show-desktop">
        <div className="nav-contents">
          <Link href="/" id="home-link" className="sentry-unmask">
            <Image src={EPlogo} className="logo sentry-unmask" alt="logo" />
            Empower Plant
          </Link>

          <div id="top-right-links">
            <Link href="/about" className="sentry-unmask">
              About
            </Link>
            <Link
              href={frontendSlowdown ? '/products-fes' : '/products'}
              className="sentry-unmask"
            >
              Products
            </Link>
            <Link href="/cart">
              <span className="sentry-unmask">Cart</span>
              {cart.items.length > 0 ? (
                <span>
                  <span className="sentry-unmask"> ($</span>
                  <span className="sentry-mask">{cart.total}.00</span>
                  <span className="sentry-unmask">)</span>
                </span>
              ) : (
                ''
              )}
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}

const mapStateToProps = (state, ownProps) => {
  return {
    cart: state.cart,
    products: state.products,
  };
};

export default connect(mapStateToProps, { resetCart, addProduct, setProducts })(
  Sentry.withProfiler(Nav, { name: 'Nav' })
);
