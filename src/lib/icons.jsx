// Icônes de l'application : Phosphor (licence MIT), le même jeu que fleetdesk.fr.
// Les écrans importent d'ici, sous des noms stables (ceux de Lucide, l'ancien jeu),
// pour ne pas dépendre de la bibliothèque. Les pictos sont en style plein ; les
// signes d'interface (croix, chevrons, flèches, plus, loupe…) en style gras, car
// en plein ils deviennent des aplats peu lisibles.
import { forwardRef } from 'react'
import * as P from '@phosphor-icons/react'

const UI = new Set(['ArrowDownRight','ArrowLeft','ArrowLeftRight','ArrowRight','ArrowUpRight','Check','ChevronDown','ChevronLeft','ChevronRight','ChevronsUpDown','ExternalLink','Loader2','Menu','Plus','RefreshCw','RotateCcw','Search','X','Hash','ChevronUp','GripVertical','Minus','MoreHorizontal'])
const MAP = {
  AlertCircle:'WarningCircle', AlertTriangle:'Warning', Archive:'Archive', ArrowDownRight:'ArrowDownRight', ArrowLeft:'ArrowLeft',
  ArrowLeftRight:'ArrowsLeftRight', ArrowRight:'ArrowRight', ArrowUpRight:'ArrowUpRight', Bell:'Bell', Briefcase:'Briefcase',
  Building2:'Buildings', Cake:'Cake', CalendarClock:'CalendarCheck', Camera:'Camera', Car:'Car', Check:'Check',
  CheckCircle2:'CheckCircle', ChevronDown:'CaretDown', ChevronLeft:'CaretLeft', ChevronRight:'CaretRight', ChevronsUpDown:'CaretUpDown',
  ClipboardCheck:'ClipboardText', Clock:'Clock', Coins:'Coins', CreditCard:'CreditCard', Download:'DownloadSimple', Droplets:'Drop',
  ExternalLink:'ArrowSquareOut', Eye:'Eye', EyeOff:'EyeSlash', FileText:'FileText', Fuel:'GasPump', Gauge:'Gauge', Globe:'Globe',
  GraduationCap:'GraduationCap', Hash:'Hash', IdCard:'IdentificationCard', ImageIcon:'Image', Inbox:'Tray', Info:'Info', Layers:'Stack',
  LayoutGrid:'SquaresFour', LayoutList:'Rows', Loader2:'CircleNotch', Lock:'Lock', Mail:'Envelope', MapPin:'MapPin', Menu:'List',
  Paperclip:'Paperclip', Pencil:'PencilSimple', PlayCircle:'PlayCircle', Plus:'Plus', RefreshCw:'ArrowsClockwise', RotateCcw:'ArrowCounterClockwise',
  Search:'MagnifyingGlass', Shield:'ShieldCheck', SlidersHorizontal:'SlidersHorizontal', Sparkles:'Sparkle', Trash2:'Trash',
  TrendingDown:'TrendDown', TrendingUp:'TrendUp', Truck:'Truck', Upload:'UploadSimple', User:'User', UserMinus:'UserMinus',
  UserPlus:'UserPlus', Users:'Users', Wand2:'MagicWand', Wrench:'Wrench', X:'X', XCircle:'XCircle', Zap:'Lightning',
  Activity:'Pulse', ChevronUp:'CaretUp', Circle:'Circle', FileBarChart:'ChartBar', GripVertical:'DotsSixVertical', History:'ClockCounterClockwise',
  LayoutDashboard:'SquaresFour', LogOut:'SignOut', Minus:'Minus', MoreHorizontal:'DotsThree', PanelLeft:'SidebarSimple', Play:'Play',
  Settings:'Gear', StickyNote:'Note', Tag:'Tag',
}
// strokeWidth et absoluteStrokeWidth (props Lucide) sont ignorés.
const make = name => {
  const C = P[MAP[name]]
  if (!C) throw new Error(`Phosphor manquant pour ${name}`)
  const Icon = forwardRef(({ strokeWidth, absoluteStrokeWidth, size = 24, ...rest }, ref) =>
    <C ref={ref} size={size} weight={UI.has(name) ? 'bold' : 'fill'} {...rest} />)
  Icon.displayName = name
  return Icon
}
export const AlertCircle = make('AlertCircle'), AlertTriangle = make('AlertTriangle'), Archive = make('Archive'), ArrowDownRight = make('ArrowDownRight'), ArrowLeft = make('ArrowLeft'), ArrowLeftRight = make('ArrowLeftRight'), ArrowRight = make('ArrowRight'), ArrowUpRight = make('ArrowUpRight'), Bell = make('Bell'), Briefcase = make('Briefcase'), Building2 = make('Building2'), Cake = make('Cake'), CalendarClock = make('CalendarClock'), Camera = make('Camera'), Car = make('Car'), Check = make('Check'), CheckCircle2 = make('CheckCircle2'), ChevronDown = make('ChevronDown'), ChevronLeft = make('ChevronLeft'), ChevronRight = make('ChevronRight'), ChevronsUpDown = make('ChevronsUpDown'), ClipboardCheck = make('ClipboardCheck'), Clock = make('Clock'), Coins = make('Coins'), CreditCard = make('CreditCard'), Download = make('Download'), Droplets = make('Droplets'), ExternalLink = make('ExternalLink'), Eye = make('Eye'), EyeOff = make('EyeOff'), FileText = make('FileText'), Fuel = make('Fuel'), Gauge = make('Gauge'), Globe = make('Globe'), GraduationCap = make('GraduationCap'), Hash = make('Hash'), IdCard = make('IdCard'), ImageIcon = make('ImageIcon'), Inbox = make('Inbox'), Info = make('Info'), Layers = make('Layers'), LayoutGrid = make('LayoutGrid'), LayoutList = make('LayoutList'), Loader2 = make('Loader2'), Lock = make('Lock'), Mail = make('Mail'), MapPin = make('MapPin'), Menu = make('Menu'), Paperclip = make('Paperclip'), Pencil = make('Pencil'), PlayCircle = make('PlayCircle'), Plus = make('Plus'), RefreshCw = make('RefreshCw'), RotateCcw = make('RotateCcw'), Search = make('Search'), Shield = make('Shield'), SlidersHorizontal = make('SlidersHorizontal'), Sparkles = make('Sparkles'), Trash2 = make('Trash2'), TrendingDown = make('TrendingDown'), TrendingUp = make('TrendingUp'), Truck = make('Truck'), Upload = make('Upload'), User = make('User'), UserMinus = make('UserMinus'), UserPlus = make('UserPlus'), Users = make('Users'), Wand2 = make('Wand2'), Wrench = make('Wrench'), X = make('X'), XCircle = make('XCircle'), Zap = make('Zap'), Activity = make('Activity'), ChevronUp = make('ChevronUp'), Circle = make('Circle'), FileBarChart = make('FileBarChart'), GripVertical = make('GripVertical'), History = make('History'), LayoutDashboard = make('LayoutDashboard'), LogOut = make('LogOut'), Minus = make('Minus'), MoreHorizontal = make('MoreHorizontal'), PanelLeft = make('PanelLeft'), Play = make('Play'), Settings = make('Settings'), StickyNote = make('StickyNote'), Tag = make('Tag')
