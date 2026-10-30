"use client";

import React, { useState, useRef, useEffect } from "react";
import { Download, Image as ImageIcon, FileCode2, FileSpreadsheet, ChevronDown } from "lucide-react";
import { useToast } from "@/components/ui/toast-context";
import {
  exportCardAsPng,
  exportCardAsSvg,
  exportTableAsCsv,
  ChartExportConfig,
} from "@/lib/reports/report-exporter";

interface DownloadCardMenuProps {
  cardId: string;
  svgElementId: string;
  filename: string;
  config: ChartExportConfig;
  csvHeaders: string[];
  csvRows: (string | number)[][];
}

export function DownloadCardMenu({
  cardId,
  svgElementId,
  filename,
  config,
  csvHeaders,
  csvRows,
}: DownloadCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDownloadPng = async () => {
    try {
      setIsExporting(true);
      setIsOpen(false);
      await exportCardAsPng(config, filename);
      toast(`Downloaded high-res PNG image`, { type: "success" });
    } catch {
      toast("Failed to export image", { type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = () => {
    try {
      setIsOpen(false);
      exportCardAsSvg(svgElementId, filename, config.questionTitle);
      toast(`Downloaded vector SVG graphic`, { type: "success" });
    } catch {
      toast("Failed to export SVG", { type: "error" });
    }
  };

  const handleDownloadCsv = () => {
    try {
      setIsOpen(false);
      exportTableAsCsv(filename, csvHeaders, csvRows);
      toast(`Exported dataset as CSV`, { type: "success" });
    } catch {
      toast("Failed to export CSV", { type: "error" });
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] border border-[#EDE8E0] bg-white hover:bg-[#F7F5F0] text-[#454B57] hover:text-[#12141A] text-[12.5px] font-medium transition-colors shadow-2xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/30"
        title="Download chart visualization"
        aria-label="Download options"
      >
        <Download className="h-3.5 w-3.5 text-[#666C78]" />
        <span>Download</span>
        <ChevronDown
          className={`h-3 w-3 text-[#666C78] transition-transform duration-180 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-52 rounded-[12px] bg-white border border-[#EDE8E0] shadow-lg p-1.5 z-30 animate-scale-in"
          style={{
            transformOrigin: "top right",
          }}
        >
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#8C93A3] border-b border-[#F0ECE4] mb-1">
            Export Chart
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadPng}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#F7F5F0] transition-colors cursor-pointer group"
          >
            <div className="p-1 rounded-[6px] bg-[#FFF1EA] text-[#FF5A1F] group-hover:bg-[#FF5A1F] group-hover:text-white transition-colors">
              <ImageIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-medium text-[#12141A]">Download PNG</div>
              <div className="text-[11px] text-[#8C93A3]">High-res 2x retina image</div>
            </div>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadSvg}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#F7F5F0] transition-colors cursor-pointer group"
          >
            <div className="p-1 rounded-[6px] bg-[#EAEEFF] text-[#3D5AFE] group-hover:bg-[#3D5AFE] group-hover:text-white transition-colors">
              <FileCode2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-medium text-[#12141A]">Download SVG</div>
              <div className="text-[11px] text-[#8C93A3]">Scalable vector graphics</div>
            </div>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDownloadCsv}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left rounded-[8px] text-[13px] text-[#12141A] hover:bg-[#F7F5F0] transition-colors cursor-pointer group"
          >
            <div className="p-1 rounded-[6px] bg-[#E4F7EF] text-[#12B886] group-hover:bg-[#12B886] group-hover:text-white transition-colors">
              <FileSpreadsheet className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="font-medium text-[#12141A]">Export CSV</div>
              <div className="text-[11px] text-[#8C93A3]">Raw data table spreadsheet</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
