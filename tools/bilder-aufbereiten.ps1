# Bereitet die Original-Zeichnungen aus zeichnungen/ fuer die Webseite auf:
# - schneidet den transparenten Rand weg
# - verkleinert auf eine sinnvolle Groesse
# - speichert alles nach assets/img/
#
# Ausfuehren (im Projektordner):
#   powershell -ExecutionPolicy Bypass -File tools\bilder-aufbereiten.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$src  = Join-Path $root "zeichnungen"
$out  = Join-Path $root "assets\img"

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class Bild {
    // Kleinstes Rechteck, das alle sichtbaren Pixel enthaelt
    public static Rectangle Inhalt(Bitmap b) {
        var d = b.LockBits(new Rectangle(0, 0, b.Width, b.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        var px = new byte[d.Stride * b.Height];
        Marshal.Copy(d.Scan0, px, 0, px.Length);
        b.UnlockBits(d);
        int x0 = b.Width, y0 = b.Height, x1 = -1, y1 = -1;
        for (int y = 0; y < b.Height; y++) {
            int row = y * d.Stride;
            for (int x = 0; x < b.Width; x++) {
                if (px[row + x * 4 + 3] > 10) {
                    if (x < x0) x0 = x; if (x > x1) x1 = x;
                    if (y < y0) y0 = y; if (y > y1) y1 = y;
                }
            }
        }
        if (x1 < 0) return Rectangle.Empty;
        return Rectangle.FromLTRB(x0, y0, x1 + 1, y1 + 1);
    }

    public static Rectangle Vereinigen(Rectangle a, Rectangle b) {
        if (a.IsEmpty) return b;
        if (b.IsEmpty) return a;
        return Rectangle.Union(a, b);
    }

    public static Rectangle Rand(Rectangle r, int pad, int w, int h) {
        return Rectangle.FromLTRB(Math.Max(0, r.Left - pad), Math.Max(0, r.Top - pad),
                                  Math.Min(w, r.Right + pad), Math.Min(h, r.Bottom + pad));
    }

    // Ausschnitt nehmen und so verkleinern, dass er in maxW x maxH passt
    public static void Speichern(Bitmap src, Rectangle r, int maxW, int maxH, string ziel, bool jpg) {
        double s = Math.Min(1.0, Math.Min((double)maxW / r.Width, (double)maxH / r.Height));
        int w = Math.Max(1, (int)Math.Round(r.Width * s));
        int h = Math.Max(1, (int)Math.Round(r.Height * s));
        using (var dst = new Bitmap(w, h, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(dst)) {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            if (jpg) g.Clear(Color.White);
            g.DrawImage(src, new Rectangle(0, 0, w, h), r, GraphicsUnit.Pixel);
            if (jpg) {
                var enc = Array.Find(ImageCodecInfo.GetImageEncoders(), e => e.MimeType == "image/jpeg");
                var p = new EncoderParameters(1);
                p.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 82L);
                dst.Save(ziel, enc, p);
            } else {
                dst.Save(ziel, ImageFormat.Png);
            }
        }
    }
}
"@

function Ordner($pfad) { New-Item -ItemType Directory -Force $pfad | Out-Null }

# Ein einzelnes Bild: Rand wegschneiden, verkleinern
function Einzelbild($datei, $ziel, $maxW, $maxH, $jpg = $false) {
    $b = New-Object System.Drawing.Bitmap $datei
    try {
        $r = if ($jpg) { New-Object System.Drawing.Rectangle 0, 0, $b.Width, $b.Height } else { [Bild]::Inhalt($b) }
        $r = [Bild]::Rand($r, 8, $b.Width, $b.Height)
        [Bild]::Speichern($b, $r, $maxW, $maxH, $ziel, $jpg)
    } finally { $b.Dispose() }
}

# Eine Bildfolge: alle Frames bekommen denselben Ausschnitt, damit nichts springt
function Bildfolge($dateien, $zielOrdner, $maxW, $maxH) {
    Ordner $zielOrdner
    Get-ChildItem $zielOrdner -Filter *.png | Remove-Item
    $box = [System.Drawing.Rectangle]::Empty
    $w = 0; $h = 0
    foreach ($d in $dateien) {
        $b = New-Object System.Drawing.Bitmap $d
        $box = [Bild]::Vereinigen($box, [Bild]::Inhalt($b)); $w = $b.Width; $h = $b.Height
        $b.Dispose()
    }
    $box = [Bild]::Rand($box, 8, $w, $h)
    $i = 1
    foreach ($d in $dateien) {
        $b = New-Object System.Drawing.Bitmap $d
        [Bild]::Speichern($b, $box, $maxW, $maxH, (Join-Path $zielOrdner ("{0:D3}.png" -f $i)), $false)
        $b.Dispose(); $i++
    }
    Write-Host "  $($dateien.Count) Frames -> $zielOrdner"
}

# Frames nach der Nummer im Dateinamen sortieren (Procreate: Name-1, Name-2, ... Name-10)
function Nummeriert($ordner, $muster) {
    Get-ChildItem $ordner -Filter $muster |
        Sort-Object { [int]([regex]::Match($_.BaseName, '(\d+)$').Groups[1].Value) } |
        ForEach-Object { $_.FullName }
}

Write-Host "Marke"
Ordner "$out\marke"
Einzelbild "$src\marke\logo.png"      "$out\marke\logo.png"      600 600
Einzelbild "$src\marke\instagram.png" "$out\marke\instagram.png" 160 160
Einzelbild "$src\marke\linkedin.png"  "$out\marke\linkedin.png"  160 160

# Der Schriftzug wurde wegradiert -> rueckwaerts abspielen, dann zeichnet er sich.
# Teil 2 ist das Ende des Wegradierens (bis leer), Teil 1 der Anfang (voller Name).
$teil2 = @(Nummeriert "$src\marke\leo-pfyl-frames" "Schriftanimation_2-*.png"); [array]::Reverse($teil2)
$teil1 = @(Nummeriert "$src\marke\leo-pfyl-frames" "Schriftanimation_1-*.png"); [array]::Reverse($teil1)
Bildfolge ($teil2 + $teil1) "$out\marke\schriftzug" 1000 700

Write-Host "Figuren"
Ordner "$out\figuren"
Einzelbild "$src\figuren\Figur_Zeigend.png"   "$out\figuren\zeigend.png"   700 900
Einzelbild "$src\figuren\Figur_zeichnend.png" "$out\figuren\zeichnend.png" 700 900
Bildfolge @(Nummeriert "$src\figuren\hallo-frames" "*.png") "$out\figuren\hallo" 700 900

Write-Host "Daumenkino"
Bildfolge @(Nummeriert "$src\daumenkino\animation-1-kacke" "*.png") "$out\daumenkino\kacke" 1100 900
Bildfolge @(Nummeriert "$src\daumenkino\animation-2-nase"  "*.png") "$out\daumenkino\nase"  1100 900
Bildfolge @(Nummeriert "$src\daumenkino\animation-3-glas"  "*.png") "$out\daumenkino\glas"  1100 900

Write-Host "Deko"
Ordner "$out\deko"
Get-ChildItem "$src\deko" -Filter *.png | ForEach-Object {
    $max = if ($_.Name -like "doodle-*") { 260 } else { 520 }
    Einzelbild $_.FullName "$out\deko\$($_.Name)" $max $max
}

Write-Host "Foto"
Ordner "$out\foto"
Einzelbild "$src\foto\leo.png" "$out\foto\leo.jpg" 900 1000 $true

Write-Host "Fertig."
