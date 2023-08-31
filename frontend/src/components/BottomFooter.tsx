import styled from 'styled-components/macro'
import tw from 'twin.macro'

const FOOTER_LINKS = [
  {
    href: 'https://seamlessprotocol.medium.com/seamless-protocol-terms-of-use-f9d75a855fb3',
    label: 'Terms',
    key: 'Terms',
  },
  {
    href: 'https://seamlessprotocol.medium.com/seamless-privacy-policy-2ebfda169143',
    label: 'Privacy',
    key: 'Privacy',
  },
  {
    href: 'https://docs.seamlessprotocol.com/overview/introduction-to-seamless-protocol',
    label: 'Docs',
    key: 'Docs',
  },
  {
    href: 'https://docs.seamlessprotocol.com/overview/faq',
    label: 'FAQ',
    key: 'FAQ',
  },
  {
    href: 'https://onchainsummer.xyz/base',
    label: 'BASE | Onchain Summer',
    key: 'Base',
  },
]

const FOOTER_ICONS = [
  {
    href: 'https://t.me/seamless_protocol',
    icon: 'telegram.svg',
    title: 'Telegram',
  },
  {
    href: 'https://twitter.com/seamlessfi',
    icon: 'twitter.svg',
    title: 'Twitter',
  },
  {
    href: 'https://github.com/seamless-protocol/',
    icon: 'gh.svg',
    title: 'Github',
  },
]

const BottomFooter = () => (
  <FooterContainer>
    <LinkContainer>
      <div className="flex gap-4">
        {FOOTER_LINKS.map((link) => (
          <a href={link.href} key={link.key} target="_blank" rel="noreferrer">
            <div className="">{link.label}</div>
          </a>
        ))}
      </div>
      <div className="flex gap-2">
        {FOOTER_ICONS.map((icon) => (
          <a href={icon.href} key={icon.title} target="_blank" rel="noreferrer">
            <img src={icon.icon} alt="" height={12} />
          </a>
        ))}
      </div>
    </LinkContainer>
  </FooterContainer>
)

const FooterContainer = styled.div`
  ${tw`fixed bottom-0 left-0 w-full h-14 text-white text-center text-xs`}
  background: linear-gradient(248.86deg, #506ff3 1%, #cdf3a2 15%, #21e1e1 30%, #d69bdf 50%, #506ff3 81%);
`

const LinkContainer = styled.div`
  ${tw`flex justify-between px-8 items-center h-full`}
`

export default BottomFooter
