
import React, { useState } from 'react';
import { ArrowLeftIcon, PrinterIcon } from './icons';
import { useTheme } from '../ThemeContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CertificateProps {
  courseTitle: string;
  onBack: () => void;
}

function convertOklchString(str: string): string {
  if (!str || typeof str !== 'string' || !str.includes('oklch')) return str;
  return str.replace(/oklch\([^)]+\)/gi, (match) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return 'rgb(0, 0, 0)';
      ctx.fillStyle = match;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      if (a === 255) {
        return `rgb(${r}, ${g}, ${b})`;
      } else {
        return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(2)})`;
      }
    } catch {
      return 'rgb(0, 0, 0)';
    }
  });
}

const Certificate: React.FC<CertificateProps> = ({ courseTitle, onBack }) => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);
  const [certError, setCertError] = useState<string | null>(null);

  const themeConfig = {
    cyber: {
      accentText: 'text-cyan-400',
      accentTextHover: 'hover:text-cyan-300',
      accentBorder: 'border-cyan-500',
      accentTextDark: 'text-cyan-600',
      accentButton: 'bg-cyan-600',
      accentButtonHover: 'hover:bg-cyan-500',
      accentRing: 'focus:ring-cyan-500',
      accentBorderFocus: 'focus:border-cyan-500',
      shadow: 'shadow-cyan-500/30',
      formBg: 'bg-gray-800', formBorder: 'border-gray-700',
      inputBg: 'bg-gray-900', inputBorder: 'border-gray-600', inputText: 'text-white',
      cancelText: 'text-gray-400', cancelHover: 'hover:text-white',
      certWrapperBg: 'bg-gray-900',
    },
    sunrise: {
      accentText: 'text-amber-300',
      accentTextHover: 'hover:text-amber-200',
      accentBorder: 'border-amber-500',
      accentTextDark: 'text-amber-600',
      accentButton: 'bg-amber-600',
      accentButtonHover: 'hover:bg-amber-500',
      accentRing: 'focus:ring-amber-500',
      accentBorderFocus: 'focus:border-amber-500',
      shadow: 'shadow-amber-500/30',
      formBg: 'bg-black/20', formBorder: 'border-amber-800/50',
      inputBg: 'bg-black/20', inputBorder: 'border-amber-700/50', inputText: 'text-yellow-100',
      cancelText: 'text-amber-200/80', cancelHover: 'hover:text-amber-100',
      certWrapperBg: 'from-amber-900 via-orange-900 to-yellow-900',
    },
    forest: {
      accentText: 'text-emerald-400',
      accentTextHover: 'hover:text-emerald-300',
      accentBorder: 'border-emerald-500',
      accentTextDark: 'text-emerald-600',
      accentButton: 'bg-emerald-600',
      accentButtonHover: 'hover:bg-emerald-500',
      accentRing: 'focus:ring-emerald-500',
      accentBorderFocus: 'focus:border-emerald-500',
      shadow: 'shadow-emerald-500/30',
      formBg: 'bg-black/20', formBorder: 'border-emerald-800/50',
      inputBg: 'bg-black/20', inputBorder: 'border-emerald-700/50', inputText: 'text-green-100',
      cancelText: 'text-green-200/80', cancelHover: 'hover:text-green-100',
      certWrapperBg: 'from-green-900 via-emerald-900 to-slate-900',
    },
    light: {
      accentText: 'text-amber-600',
      accentTextHover: 'hover:text-amber-500',
      accentBorder: 'border-amber-500',
      accentTextDark: 'text-amber-700',
      accentButton: 'bg-amber-600',
      accentButtonHover: 'hover:bg-amber-500',
      accentRing: 'focus:ring-amber-500',
      accentBorderFocus: 'focus:border-amber-500',
      shadow: 'shadow-amber-500/20',
      formBg: 'bg-white', formBorder: 'border-amber-100',
      inputBg: 'bg-amber-50/10', inputBorder: 'border-amber-200', inputText: 'text-amber-950',
      cancelText: 'text-amber-900/60', cancelHover: 'hover:text-amber-950',
      certWrapperBg: 'bg-amber-50/30',
    },
    classic: {
      accentText: 'text-blue-600',
      accentTextHover: 'hover:text-blue-500',
      accentBorder: 'border-blue-500',
      accentTextDark: 'text-blue-700',
      accentButton: 'bg-blue-600',
      accentButtonHover: 'hover:bg-blue-500',
      accentRing: 'focus:ring-blue-500',
      accentBorderFocus: 'focus:border-blue-500',
      shadow: 'shadow-indigo-500/20',
      formBg: 'bg-white', formBorder: 'border-slate-200',
      inputBg: 'bg-slate-50', inputBorder: 'border-slate-300', inputText: 'text-slate-900',
      cancelText: 'text-slate-500', cancelHover: 'hover:text-slate-800',
      certWrapperBg: 'bg-slate-100',
    },
    sunny: {
      accentText: 'text-yellow-600',
      accentTextHover: 'hover:text-yellow-500',
      accentBorder: 'border-yellow-500',
      accentTextDark: 'text-yellow-700',
      accentButton: 'bg-yellow-600',
      accentButtonHover: 'hover:bg-yellow-500',
      accentRing: 'focus:ring-yellow-500',
      accentBorderFocus: 'focus:border-yellow-500',
      shadow: 'shadow-yellow-500/20',
      formBg: 'bg-white', formBorder: 'border-yellow-100',
      inputBg: 'bg-yellow-50/10', inputBorder: 'border-yellow-200', inputText: 'text-yellow-950',
      cancelText: 'text-amber-900/60', cancelHover: 'hover:text-yellow-950',
      certWrapperBg: 'bg-yellow-50/30',
    }
  };
  const currentTheme = themeConfig[theme];


  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const input = document.getElementById('certificate-content');
    if (input) {
      try {
        setCertError(null);
        console.log("Starting PDF generation...");
        const canvas = await html2canvas(input, {
          scale: 2,
          useCORS: true,
          onclone: (clonedDoc) => {
            // 1. Convert oklch colors in style tags
            const styleTags = Array.from(clonedDoc.querySelectorAll('style'));
            styleTags.forEach((style) => {
              if (style.textContent && style.textContent.includes('oklch')) {
                style.textContent = convertOklchString(style.textContent);
              }
            });

            // 2. Convert oklch colors in document stylesheets if accessible
            try {
              Array.from(clonedDoc.styleSheets).forEach((sheet) => {
                try {
                  const rules = sheet.cssRules || sheet.rules;
                  if (rules) {
                    Array.from(rules).forEach((rule) => {
                      const styleRule = rule as CSSStyleRule;
                      if (styleRule.style && styleRule.style.cssText && styleRule.style.cssText.includes('oklch')) {
                        styleRule.style.cssText = convertOklchString(styleRule.style.cssText);
                      }
                    });
                  }
                } catch {
                  // Ignore cross-origin stylesheet access errors
                }
              });
            } catch {
              // Ignore stylesheet iteration errors
            }

            // 3. Convert inline style attributes
            const allElements = Array.from(clonedDoc.querySelectorAll('*'));
            allElements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes('oklch')) {
                htmlEl.style.cssText = convertOklchString(htmlEl.style.cssText);
              }
            });

            // 4. Force computed colors on certificate element and its children to RGB
            const certElem = clonedDoc.getElementById('certificate-content');
            if (certElem) {
              const elements = [certElem, ...Array.from(certElem.querySelectorAll('*'))] as HTMLElement[];
              elements.forEach((el) => {
                const win = clonedDoc.defaultView || window;
                const computed = win.getComputedStyle(el);
                if (computed) {
                  if (computed.color && computed.color.includes('oklch')) {
                    el.style.color = convertOklchString(computed.color);
                  }
                  if (computed.backgroundColor && computed.backgroundColor.includes('oklch')) {
                    el.style.backgroundColor = convertOklchString(computed.backgroundColor);
                  }
                  if (computed.borderColor && computed.borderColor.includes('oklch')) {
                    el.style.borderColor = convertOklchString(computed.borderColor);
                  }
                  if (computed.boxShadow && computed.boxShadow.includes('oklch')) {
                    el.style.boxShadow = convertOklchString(computed.boxShadow);
                  }
                }
              });
            }
          }
        });
        console.log("Canvas generated");
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`cheti_${courseTitle}.pdf`);
        console.log("PDF saved successfully");
      } catch (error) {
        console.error("Error generating PDF:", error);
        setCertError("Imeshindwa kutengeneza PDF. Tafadhali jaribu tena.");
      }
    } else {
      console.error("Certificate element not found");
      setCertError("Cheti hakijapatikana.");
    }
  };

  const certificateContent = (
    <div className={`certificate-wrapper ${currentTheme.certWrapperBg} flex justify-center items-center p-4`}>
      <div id="certificate-content" className={`w-full max-w-4xl bg-white text-gray-800 p-8 sm:p-10 border-8 ${currentTheme.accentBorder} rounded-lg aspect-[1.414/1] flex flex-col items-center justify-center text-center shadow-2xl ${currentTheme.shadow}`}>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-700 font-cursive">Cheti cha Kukamilisha Kozi</h1>
        <p className="mt-4 sm:mt-6 text-lg sm:text-xl">Hii inathibitisha kwamba</p>
        <p className={`mt-4 text-3xl sm:text-4xl font-bold ${currentTheme.accentTextDark} underline px-4`}>{name || "Mwanafunzi Shupavu"}</p>
        <p className="mt-4 text-lg sm:text-xl">amekamilisha kwa mafanikio kozi ya</p>
        <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-800">{courseTitle}</h2>
        <div className="mt-auto w-full flex justify-between items-end pt-6 text-xs sm:text-sm">
          <div className="text-left">
            <p className="border-t-2 border-gray-400 pt-2">Tarehe: {new Date().toLocaleDateString('sw-TZ')}</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-700 font-cursive">Giniaz College</h3>
          </div>
          <div className="text-right">
            <p className="border-t-2 border-gray-400 pt-2">Sahihi ya Mkuu wa Chuo</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isGenerated) {
    return (
      <div className="printable-area">
        {certError && (
          <div className="p-4 mb-4 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-sm flex justify-between items-center non-printable">
            <span>{certError}</span>
            <button onClick={() => setCertError(null)} className="text-xs underline hover:no-underline">Funga</button>
          </div>
        )}
        <div className="flex justify-between items-center mb-6 non-printable">
          <button 
            onClick={onBack} 
            className={`flex items-center ${currentTheme.accentText} ${currentTheme.accentTextHover} transition-colors`}
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Rudi
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className={`flex items-center px-4 py-2 ${currentTheme.accentButton} text-white font-semibold rounded-lg ${currentTheme.accentButtonHover} transition-colors`}
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Chapisha
            </button>
            <button
              onClick={handleDownloadPDF}
              className={`flex items-center px-4 py-2 ${currentTheme.accentButton} text-white font-semibold rounded-lg ${currentTheme.accentButtonHover} transition-colors`}
            >
              <PrinterIcon className="h-5 w-5 mr-2" />
              Pakua PDF
            </button>
          </div>
        </div>
        {certificateContent}
      </div>
    );
  }

  return (
    <div className={`max-w-md mx-auto ${currentTheme.formBg} p-8 rounded-lg border ${currentTheme.formBorder} non-printable`}>
      <h2 className={`text-2xl font-bold text-center ${currentTheme.accentText} mb-4`}>Jaza Jina Lako</h2>
      <p className={`text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'} mb-6`}>Tafadhali ingiza jina lako kamili litakaloonekana kwenye cheti.</p>
      <form onSubmit={(e) => { e.preventDefault(); setIsGenerated(true); }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mfano: Juma Kaseja"
          required
          className={`w-full ${currentTheme.inputBg} border ${currentTheme.inputBorder} rounded-md px-4 py-2 ${currentTheme.inputText} focus:ring-2 ${currentTheme.accentRing} ${currentTheme.accentBorderFocus} outline-none`}
        />
        <div className="mt-6 flex justify-between items-center">
          <button 
            type="button"
            onClick={onBack} 
            className={`${currentTheme.cancelText} ${currentTheme.cancelHover} transition-colors`}
          >
            Ghairi
          </button>
          <button
            type="submit"
            className={`px-6 py-2 ${currentTheme.accentButton} text-white font-semibold rounded-lg ${currentTheme.accentButtonHover} transition-colors`}
          >
            Tengeneza Cheti
          </button>
        </div>
      </form>
    </div>
  );
};

export default Certificate;
