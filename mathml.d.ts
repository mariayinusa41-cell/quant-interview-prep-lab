// MathML intrinsic elements.
//
// The installed React JSX typings don't declare MathML tags, so using native
// <math>/<mfrac>/<mrow> etc. in TSX errors with "Property 'mfrac' does not
// exist on type 'JSX.IntrinsicElements'". These are real, standard HTML
// elements — every browser this site targets renders them natively — so this
// just tells TypeScript they exist rather than pulling in a maths library.
//
// Augments React.JSX rather than the global JSX namespace because the
// project compiles with jsx: "react-jsx", where the global one is not what
// TSX resolves against.

import type { DetailedHTMLProps, HTMLAttributes } from "react";

type MathMLProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  display?: "block" | "inline";
  xmlns?: string;
  mathvariant?: string;
  accent?: boolean | "true" | "false";
  stretchy?: boolean | "true" | "false";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps;
      mrow: MathMLProps;
      mi: MathMLProps;
      mn: MathMLProps;
      mo: MathMLProps;
      mfrac: MathMLProps;
      msup: MathMLProps;
      msub: MathMLProps;
      msqrt: MathMLProps;
      mtext: MathMLProps;
      mspace: MathMLProps;
      msubsup: MathMLProps;
      mover: MathMLProps;
      munder: MathMLProps;
    }
  }
}
